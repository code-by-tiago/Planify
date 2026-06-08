import PptxGenJS from "pptxgenjs";
import {
  computeSlideBodyFontSize,
  computeSlideTitleFontSize,
  SLIDE_MIN_BODY_FONT,
} from "@/lib/slides/slide-typography";
import type { MaterialEngineResponse } from "./material-engine-types";
import { resolveSlideTheme, type SlideTheme } from "./slide-design-themes";
import { assignSlideSequenceLabels, orderSlidesPedagogically } from "./slide-pedagogy";

type SlideItem = NonNullable<MaterialEngineResponse["slides"]>[number];

async function fetchImageDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Planify/1.0 (educational slides)" },
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length < 200 || buffer.length > 8_000_000) return null;

    const base64 = buffer.toString("base64");
    const mime = contentType.split(";")[0].trim().toLowerCase();
    const ext = mime.includes("png")
      ? "png"
      : mime.includes("webp")
        ? "webp"
        : mime.includes("gif")
          ? "gif"
          : "jpeg";

    // PptxGenJS exige data URL completo (com prefixo "data:").
    return `data:image/${ext};base64,${base64}`;
  } catch {
    return null;
  }
}

/** Pré-carrega todas as imagens em paralelo (mais rápido e evita timeouts em série). */
async function preloadImages(slides: SlideItem[]): Promise<Map<string, string>> {
  const urls = [
    ...new Set(
      slides
        .map((slide) => slide.imageUrl?.trim())
        .filter((url): url is string => Boolean(url)),
    ),
  ];

  const entries = await Promise.all(
    urls.map(async (url) => [url, await fetchImageDataUrl(url)] as const),
  );

  const map = new Map<string, string>();
  for (const [url, data] of entries) {
    if (data) map.set(url, data);
  }
  return map;
}

function drawCoverDecoration(
  pptx: PptxGenJS,
  slide: PptxGenJS.Slide,
  theme: SlideTheme,
): void {
  switch (theme.decoration) {
    case "blob":
      slide.addShape(pptx.ShapeType.ellipse, {
        x: 9.6,
        y: -1.3,
        w: 4.2,
        h: 4.2,
        fill: { color: theme.coverBgHex2 },
        line: { type: "none" },
      });
      slide.addShape(pptx.ShapeType.ellipse, {
        x: -1.3,
        y: 5,
        w: 3.6,
        h: 3.6,
        fill: { color: theme.coverBgHex2 },
        line: { type: "none" },
      });
      break;
    case "corner":
      slide.addShape(pptx.ShapeType.ellipse, {
        x: 10,
        y: -1.6,
        w: 4.4,
        h: 4.4,
        fill: { color: theme.coverBgHex2 },
        line: { type: "none" },
      });
      break;
    case "line":
      slide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 0,
        w: 13.33,
        h: 0.14,
        fill: { color: theme.accentHex },
        line: { type: "none" },
      });
      break;
    case "chalk":
      slide.addShape(pptx.ShapeType.rect, {
        x: 0.35,
        y: 0.35,
        w: 12.63,
        h: 6.8,
        fill: { type: "none" },
        line: { color: theme.coverInk, width: 1, dashType: "dash" },
      });
      break;
    default:
      break;
  }
}

function drawContentHeader(
  pptx: PptxGenJS,
  slide: PptxGenJS.Slide,
  theme: SlideTheme,
  label: string,
  position: string,
): void {
  switch (theme.headerKind) {
    case "ribbon":
      slide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 0,
        w: 13.33,
        h: 0.62,
        fill: { color: theme.accentHex },
        line: { type: "none" },
      });
      slide.addText(label, {
        x: 0.5,
        y: 0.06,
        w: 9,
        h: 0.5,
        fontSize: 11,
        color: "FFFFFF",
        bold: true,
        fontFace: theme.fontHeading,
        valign: "middle",
      });
      slide.addText(position, {
        x: 10.3,
        y: 0.06,
        w: 2.6,
        h: 0.5,
        fontSize: 11,
        color: "FFFFFF",
        align: "right",
        valign: "middle",
      });
      break;
    case "block":
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.5,
        y: 0.28,
        w: Math.min(0.55 + label.length * 0.085, 5),
        h: 0.36,
        fill: { color: theme.accentHex },
        line: { type: "none" },
        rectRadius: 0.06,
      });
      slide.addText(label, {
        x: 0.6,
        y: 0.28,
        w: 5,
        h: 0.36,
        fontSize: 10,
        color: "FFFFFF",
        bold: true,
        fontFace: theme.fontHeading,
        valign: "middle",
      });
      slide.addText(position, {
        x: 9.7,
        y: 0.28,
        w: 2.6,
        h: 0.36,
        fontSize: 10,
        color: theme.mutedInk,
        align: "right",
        valign: "middle",
      });
      break;
    case "bar":
      slide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 0,
        w: 0.16,
        h: 7.5,
        fill: { color: theme.accentHex },
        line: { type: "none" },
      });
      slide.addText(label, {
        x: 0.45,
        y: 0.28,
        w: 8,
        h: 0.35,
        fontSize: 10,
        color: theme.accentHex,
        bold: true,
        fontFace: theme.fontHeading,
      });
      slide.addText(position, {
        x: 9.7,
        y: 0.28,
        w: 2.6,
        h: 0.35,
        fontSize: 10,
        color: theme.mutedInk,
        align: "right",
      });
      break;
    default: {
      // underline / chalk
      slide.addText(label, {
        x: 0.5,
        y: 0.28,
        w: 8,
        h: 0.35,
        fontSize: 10,
        color: theme.accentHex,
        bold: true,
        fontFace: theme.fontHeading,
      });
      slide.addText(position, {
        x: 9.7,
        y: 0.28,
        w: 2.6,
        h: 0.35,
        fontSize: 10,
        color: theme.mutedInk,
        align: "right",
      });
      slide.addShape(pptx.ShapeType.line, {
        x: 0.5,
        y: 0.7,
        w: 12.3,
        h: 0,
        line: {
          color: theme.accentHex,
          width: 1.5,
          dashType: theme.headerKind === "chalk" ? "dash" : "solid",
        },
      });
      break;
    }
  }
}

export async function buildSlidesPptxBuffer(input: {
  title: string;
  slides: SlideItem[];
  themeId?: string;
}): Promise<Buffer> {
  const theme = resolveSlideTheme(input.themeId);
  const ordered = orderSlidesPedagogically([...input.slides]);
  assignSlideSequenceLabels(ordered);

  const imageMap = await preloadImages(ordered);

  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Planify";
  pptx.title = input.title;

  const contentTotal = ordered.filter(
    (s) => s.layout !== "capa" && s.layout !== "fechamento",
  ).length;
  let contentCounter = 0;

  for (const slide of ordered) {
    const layout = slide.layout ?? "conteudo";
    const pptxSlide = pptx.addSlide();

    if (layout === "capa") {
      pptxSlide.background = { color: theme.coverBgHex };
      drawCoverDecoration(pptx, pptxSlide, theme);

      pptxSlide.addText("PLANIFY · APRESENTAÇÃO", {
        x: 0.6,
        y: 1.0,
        w: 11.5,
        h: 0.4,
        fontSize: 12,
        color: theme.coverMutedInk,
        bold: true,
        charSpacing: 2,
        fontFace: theme.fontHeading,
      });
      pptxSlide.addText(slide.title, {
        x: 0.6,
        y: 1.7,
        w: 11.5,
        h: 1.8,
        fontSize: 34,
        color: theme.coverInk,
        bold: true,
        fontFace: theme.fontHeading,
        valign: "top",
      });
      if (slide.subtitle) {
        pptxSlide.addText(slide.subtitle, {
          x: 0.6,
          y: 3.6,
          w: 11,
          h: 0.9,
          fontSize: 17,
          color: theme.coverMutedInk,
          fontFace: theme.fontBody,
        });
      }
      let coverBottomY = slide.subtitle ? 4.55 : 3.65;
      pptxSlide.addText(`${ordered.length} SLIDES`, {
        x: 0.6,
        y: coverBottomY,
        w: 4,
        h: 0.3,
        fontSize: 11,
        color: theme.coverMutedInk,
        charSpacing: 2,
      });
      coverBottomY += 0.55;

      const coverData = slide.imageUrl ? imageMap.get(slide.imageUrl) : null;
      if (coverData) {
        const imageW = 8.2;
        const imageH = Math.min(2.8, Math.max(1.6, 7.1 - coverBottomY));
        const imageX = (13.33 - imageW) / 2;
        pptxSlide.addImage({
          data: coverData,
          x: imageX,
          y: coverBottomY,
          w: imageW,
          h: imageH,
          sizing: { type: "contain", w: imageW, h: imageH },
        });
      }

      if (slide.speakerNotes?.trim()) pptxSlide.addNotes(slide.speakerNotes);
      continue;
    }

    pptxSlide.background = { color: theme.contentBgHex };

    if (layout !== "fechamento") contentCounter += 1;

    const headerLabel =
      layout === "fechamento"
        ? "SÍNTESE"
        : (slide.sequenceLabel || `Etapa ${contentCounter}`).toUpperCase();
    const positionLabel =
      layout === "fechamento" ? "Fechamento" : `${contentCounter} / ${contentTotal}`;

    drawContentHeader(pptx, pptxSlide, theme, headerLabel, positionLabel);

    const bullets = (slide.bullets || []).filter((item) => item.trim());
    const imageData = slide.imageUrl ? imageMap.get(slide.imageUrl) : null;
    const hasImage = Boolean(imageData);
    const hasCallout = Boolean(slide.callout?.text);
    const bodyFontSize = computeSlideBodyFontSize({
      bullets,
      hasImage,
      hasCallout,
    });
    const titleFontSize = computeSlideTitleFontSize(bodyFontSize);
    const textWidth = 11.9;

    pptxSlide.addText(slide.title, {
      x: 0.5,
      y: 0.95,
      w: 12.2,
      h: 0.8,
      fontSize: titleFontSize,
      color: theme.titleInk,
      bold: true,
      fontFace: theme.fontHeading,
      valign: "top",
    });

    let contentBottomY = 1.8;

    if (bullets.length) {
      const bulletBlockHeight = Math.min(4.0, 0.42 * bullets.length + 0.35);
      pptxSlide.addText(
        bullets.map((text) => ({
          text,
          options: {
            bullet: { indent: 18, characterCode: "25AA" },
            paraSpaceAfter: 9,
          },
        })),
        {
          x: 0.55,
          y: contentBottomY,
          w: textWidth,
          h: bulletBlockHeight,
          fontSize: bodyFontSize,
          color: theme.bodyInk,
          fontFace: theme.fontBody,
          valign: "top",
          lineSpacingMultiple: 1.15,
        },
      );
      contentBottomY += bulletBlockHeight + 0.18;
    }

    if (hasCallout && slide.callout?.text) {
      const calloutHeight = 1.15;
      pptxSlide.addShape(pptx.ShapeType.roundRect, {
        x: 0.55,
        y: contentBottomY,
        w: textWidth,
        h: calloutHeight,
        fill: { color: theme.accentSoftHex },
        line: { color: theme.accentHex, width: 0.75 },
        rectRadius: 0.08,
      });
      pptxSlide.addText(
        [
          ...(slide.callout.title
            ? [
                {
                  text: slide.callout.title,
                  options: {
                    bold: true,
                    color: theme.accentHex,
                    fontSize: Math.max(14, bodyFontSize - 4),
                    breakLine: true,
                  },
                },
              ]
            : []),
          {
            text: slide.callout.text,
            options: {
              color: theme.bodyInk,
              fontSize: Math.max(SLIDE_MIN_BODY_FONT, bodyFontSize - 2),
            },
          },
        ],
        {
          x: 0.7,
          y: contentBottomY + 0.08,
          w: textWidth - 0.3,
          h: calloutHeight - 0.16,
          valign: "middle",
          fontFace: theme.fontBody,
        },
      );
      contentBottomY += calloutHeight + 0.18;
    }

    if (hasImage && imageData) {
      const remainingHeight = Math.max(1.6, 6.95 - contentBottomY);
      const imageW = Math.min(8.8, textWidth);
      const imageH = Math.min(2.6, remainingHeight);
      const imageX = (13.33 - imageW) / 2;
      // #region agent log
      if (typeof fetch !== "undefined") {
        fetch("http://127.0.0.1:7616/ingest/e1530077-9aac-4460-b700-4c831c23c281", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "1b39d8",
          },
          body: JSON.stringify({
            sessionId: "1b39d8",
            runId: "runtime",
            hypothesisId: "H3",
            location: "slide-pptx-builder.ts:contentSlide",
            message: "pptx image placed after text",
            data: {
              contentBottomY,
              imageY: contentBottomY,
              imageW,
              imageH,
              bodyFontSize,
              bulletCount: bullets.length,
              sizing: "contain",
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
      }
      // #endregion
      pptxSlide.addImage({
        data: imageData,
        x: imageX,
        y: contentBottomY,
        w: imageW,
        h: imageH,
        sizing: { type: "contain", w: imageW, h: imageH },
      });
    }

    if (slide.speakerNotes?.trim()) {
      pptxSlide.addNotes(slide.speakerNotes);
    }
  }

  const output = (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
  return Buffer.from(output);
}
