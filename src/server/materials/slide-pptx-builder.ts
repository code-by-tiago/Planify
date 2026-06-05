import PptxGenJS from "pptxgenjs";
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
      pptxSlide.addText(`${ordered.length} SLIDES`, {
        x: 0.6,
        y: 6.7,
        w: 4,
        h: 0.3,
        fontSize: 11,
        color: theme.coverMutedInk,
        charSpacing: 2,
      });

      const coverData = slide.imageUrl ? imageMap.get(slide.imageUrl) : null;
      if (coverData) {
        pptxSlide.addImage({
          data: coverData,
          x: 8.0,
          y: 1.7,
          w: 4.6,
          h: 3.4,
          sizing: { type: "cover", w: 4.6, h: 3.4 },
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

    pptxSlide.addText(slide.title, {
      x: 0.5,
      y: 0.95,
      w: 12.2,
      h: 0.8,
      fontSize: 23,
      color: theme.titleInk,
      bold: true,
      fontFace: theme.fontHeading,
      valign: "top",
    });

    const bullets = (slide.bullets || []).filter((item) => item.trim());
    const imageData = slide.imageUrl ? imageMap.get(slide.imageUrl) : null;
    const hasImage = Boolean(imageData);
    const textWidth = hasImage && layout !== "destaque" ? 5.9 : 11.9;

    if (bullets.length) {
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
          y: 1.8,
          w: textWidth,
          h: 4.1,
          fontSize: 15,
          color: theme.bodyInk,
          fontFace: theme.fontBody,
          valign: "top",
          lineSpacingMultiple: 1.18,
        },
      );
    }

    if (slide.callout?.text) {
      pptxSlide.addShape(pptx.ShapeType.roundRect, {
        x: 0.55,
        y: 5.55,
        w: textWidth,
        h: 1.2,
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
                    fontSize: 11,
                    breakLine: true,
                  },
                },
              ]
            : []),
          {
            text: slide.callout.text,
            options: { color: theme.bodyInk, fontSize: 12 },
          },
        ],
        {
          x: 0.7,
          y: 5.65,
          w: textWidth - 0.3,
          h: 1.0,
          valign: "middle",
          fontFace: theme.fontBody,
        },
      );
    }

    if (hasImage && imageData) {
      const imageX = layout === "destaque" ? 3.5 : 6.7;
      const imageY = layout === "destaque" ? 2.9 : 1.8;
      const imageW = layout === "destaque" ? 6 : 5.7;
      const imageH = layout === "destaque" ? 3 : 3.8;
      pptxSlide.addImage({
        data: imageData,
        x: imageX,
        y: imageY,
        w: imageW,
        h: imageH,
        sizing: { type: "cover", w: imageW, h: imageH },
      });
    }

    if (slide.speakerNotes?.trim()) {
      pptxSlide.addNotes(slide.speakerNotes);
    }
  }

  const output = (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
  return Buffer.from(output);
}
