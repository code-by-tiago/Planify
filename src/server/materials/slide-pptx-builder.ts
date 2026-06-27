import PptxGenJS from "pptxgenjs";
import {
  computeBulletBlockHeight,
  computeSlideImageHeight,
  SLIDE_CONTENT_BOTTOM,
  SLIDE_CONTENT_W,
  SLIDE_HEIGHT_IN,
  SLIDE_LAYOUT,
  SLIDE_MARGIN_X,
  SLIDE_WIDTH_IN,
} from "@/lib/slides/slide-layout";
import {
  computeSlideBodyFontSize,
  computeSlideTitleFontSize,
  SLIDE_COVER_SUBTITLE_FONT,
  SLIDE_COVER_TITLE_FONT,
  SLIDE_MIN_BODY_FONT,
} from "@/lib/slides/slide-typography";
import type { MaterialEngineResponse } from "./material-engine-types";
import { resolveSlideTheme, type SlideTheme } from "./slide-design-themes";
import { assignSlideSequenceLabels, orderSlidesPedagogically } from "./slide-pedagogy";

type SlideItem = NonNullable<MaterialEngineResponse["slides"]>[number];

const TEXT_FIT = "none" as const;
const IMAGE_PRELOAD_CONCURRENCY = 4;

function compactText(value: string, max = 126): string {
  const clean = String(value || "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const slice = clean.slice(0, max);
  const lastSpace = slice.lastIndexOf(" ");
  return `${(lastSpace > 72 ? slice.slice(0, lastSpace) : slice).trim()}...`;
}

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

    return `data:image/${ext};base64,${base64}`;
  } catch {
    return null;
  }
}

async function preloadImages(slides: SlideItem[]): Promise<Map<string, string>> {
  const urls = [
    ...new Set(
      slides
        .map((slide) => slide.imageUrl?.trim())
        .filter((url): url is string => Boolean(url)),
    ),
  ];

  const map = new Map<string, string>();
  let nextIndex = 0;
  const workers = Array.from(
    { length: Math.min(IMAGE_PRELOAD_CONCURRENCY, urls.length) },
    async () => {
      while (nextIndex < urls.length) {
        const url = urls[nextIndex];
        nextIndex += 1;
        const data = await fetchImageDataUrl(url);
        if (data) map.set(url, data);
      }
    },
  );

  await Promise.all(workers);
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
        x: 7.2,
        y: -0.98,
        w: 3.15,
        h: 3.15,
        fill: { color: theme.coverBgHex2 },
        line: { type: "none" },
      });
      slide.addShape(pptx.ShapeType.ellipse, {
        x: -0.98,
        y: 3.75,
        w: 2.7,
        h: 2.7,
        fill: { color: theme.coverBgHex2 },
        line: { type: "none" },
      });
      break;
    case "corner":
      slide.addShape(pptx.ShapeType.ellipse, {
        x: 7.5,
        y: -1.2,
        w: 3.3,
        h: 3.3,
        fill: { color: theme.coverBgHex2 },
        line: { type: "none" },
      });
      break;
    case "line":
      slide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 0,
        w: SLIDE_WIDTH_IN,
        h: 0.11,
        fill: { color: theme.accentHex },
        line: { type: "none" },
      });
      break;
    case "dots":
      for (let index = 0; index < 9; index += 1) {
        slide.addShape(pptx.ShapeType.ellipse, {
          x: 7.15 + (index % 3) * 0.42,
          y: 0.58 + Math.floor(index / 3) * 0.42,
          w: 0.11,
          h: 0.11,
          fill: { color: theme.coverBgHex2 },
          line: { type: "none" },
        });
      }
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 6.95,
        y: 3.55,
        w: 2.65,
        h: 1.22,
        fill: { color: theme.coverBgHex2, transparency: 18 },
        line: { color: theme.coverMutedInk, transparency: 60, width: 0.6 },
        rectRadius: 0.08,
      });
      break;
    case "chalk":
      slide.addShape(pptx.ShapeType.rect, {
        x: 0.26,
        y: 0.26,
        w: 9.48,
        h: 5.1,
        fill: { type: "none" },
        line: { color: theme.coverInk, width: 1, dashType: "dash" },
      });
      break;
    default:
      break;
  }
}

function drawContentBackdrop(
  pptx: PptxGenJS,
  slide: PptxGenJS.Slide,
  theme: SlideTheme,
  layout: SlideItem["layout"],
): void {
  if (theme.dark) {
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: SLIDE_HEIGHT_IN - 0.18,
      w: SLIDE_WIDTH_IN,
      h: 0.18,
      fill: { color: theme.accentHex },
      line: { type: "none" },
    });
    return;
  }

  if (layout === "destaque" || layout === "fechamento") {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 6.88,
      y: 0.76,
      w: 2.72,
      h: 4.1,
      fill: { color: theme.accentSoftHex },
      line: { type: "none" },
      rectRadius: 0.08,
    });
  }

  if (theme.decoration === "dots") {
    for (let index = 0; index < 12; index += 1) {
      slide.addShape(pptx.ShapeType.ellipse, {
        x: 8.35 + (index % 3) * 0.32,
        y: 4.15 + Math.floor(index / 3) * 0.25,
        w: 0.07,
        h: 0.07,
        fill: { color: theme.accentHex, transparency: 20 },
        line: { type: "none" },
      });
    }
  }
}

function drawContentFooter(
  pptx: PptxGenJS,
  slide: PptxGenJS.Slide,
  theme: SlideTheme,
): void {
  slide.addShape(pptx.ShapeType.line, {
    x: SLIDE_MARGIN_X,
    y: 5.22,
    w: SLIDE_CONTENT_W,
    h: 0,
    line: { color: theme.accentSoftHex, width: 1 },
  });
  slide.addText("IAPlanify", {
    x: SLIDE_MARGIN_X,
    y: 5.28,
    w: 1.6,
    h: 0.2,
    fontSize: 8.5,
    bold: true,
    color: theme.mutedInk,
    charSpacing: 1.2,
    fontFace: theme.fontHeading,
    fit: TEXT_FIT,
  });
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
        w: SLIDE_WIDTH_IN,
        h: 0.42,
        fill: { color: theme.accentHex },
        line: { type: "none" },
      });
      slide.addText(label, {
        x: 0.38,
        y: 0.04,
        w: 6.8,
        h: 0.34,
        fontSize: 11,
        color: "FFFFFF",
        bold: true,
        fontFace: theme.fontHeading,
        valign: "middle",
        fit: TEXT_FIT,
      });
      slide.addText(position, {
        x: 7.4,
        y: 0.04,
        w: 2.2,
        h: 0.34,
        fontSize: 11,
        color: "FFFFFF",
        align: "right",
        valign: "middle",
        fit: TEXT_FIT,
      });
      break;
    case "block":
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.38,
        y: 0.18,
        w: Math.min(0.5 + label.length * 0.075, 3.8),
        h: 0.3,
        fill: { color: theme.accentHex },
        line: { type: "none" },
        rectRadius: 0.05,
      });
      slide.addText(label, {
        x: 0.45,
        y: 0.18,
        w: 3.8,
        h: 0.3,
        fontSize: 10,
        color: "FFFFFF",
        bold: true,
        fontFace: theme.fontHeading,
        valign: "middle",
        fit: TEXT_FIT,
      });
      slide.addText(position, {
        x: 7.3,
        y: 0.18,
        w: 2.2,
        h: 0.3,
        fontSize: 10,
        color: theme.mutedInk,
        align: "right",
        valign: "middle",
        fit: TEXT_FIT,
      });
      break;
    case "bar":
      slide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 0,
        w: 0.12,
        h: SLIDE_HEIGHT_IN,
        fill: { color: theme.accentHex },
        line: { type: "none" },
      });
      slide.addText(label, {
        x: 0.34,
        y: 0.18,
        w: 6,
        h: 0.28,
        fontSize: 10,
        color: theme.accentHex,
        bold: true,
        fontFace: theme.fontHeading,
        fit: TEXT_FIT,
      });
      slide.addText(position, {
        x: 7.3,
        y: 0.18,
        w: 2.2,
        h: 0.28,
        fontSize: 10,
        color: theme.mutedInk,
        align: "right",
        fit: TEXT_FIT,
      });
      break;
    default: {
      slide.addText(label, {
        x: 0.38,
        y: 0.18,
        w: 6,
        h: 0.28,
        fontSize: 10,
        color: theme.accentHex,
        bold: true,
        fontFace: theme.fontHeading,
        fit: TEXT_FIT,
      });
      slide.addText(position, {
        x: 7.3,
        y: 0.18,
        w: 2.2,
        h: 0.28,
        fontSize: 10,
        color: theme.mutedInk,
        align: "right",
        fit: TEXT_FIT,
      });
      slide.addShape(pptx.ShapeType.line, {
        x: 0.38,
        y: 0.5,
        w: 9.24,
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

function addBulletsBlock(
  pptxSlide: PptxGenJS.Slide,
  bullets: string[],
  opts: {
    x: number;
    y: number;
    w: number;
    h: number;
    bodyFontSize: number;
    theme: SlideTheme;
  },
): void {
  if (!bullets.length) return;

  pptxSlide.addText(
    bullets.map((text) => ({
      text,
      options: {
        bullet: { indent: 16, characterCode: "25AA" },
        paraSpaceAfter: 8,
      },
    })),
    {
      x: opts.x,
      y: opts.y,
      w: opts.w,
      h: opts.h,
      fontSize: opts.bodyFontSize,
      color: opts.theme.bodyInk,
      fontFace: opts.theme.fontBody,
      valign: "top",
      lineSpacingMultiple: 1.12,
      fit: TEXT_FIT,
    },
  );
}

function addBulletCards(
  pptx: PptxGenJS,
  pptxSlide: PptxGenJS.Slide,
  bullets: string[],
  opts: {
    x: number;
    y: number;
    w: number;
    bodyFontSize: number;
    theme: SlideTheme;
  },
): number {
  if (!bullets.length) return 0;

  const gap = 0.12;
  const cardH = bullets.length <= 3 ? 0.66 : 0.55;
  const textSize = Math.max(16, opts.bodyFontSize - 5);

  bullets.forEach((bullet, index) => {
    const y = opts.y + index * (cardH + gap);
    pptxSlide.addShape(pptx.ShapeType.roundRect, {
      x: opts.x,
      y,
      w: opts.w,
      h: cardH,
      fill: { color: opts.theme.cardBgHex },
      line: { color: opts.theme.accentSoftHex, width: 0.9 },
      rectRadius: 0.07,
    });
    pptxSlide.addShape(pptx.ShapeType.ellipse, {
      x: opts.x + 0.15,
      y: y + 0.17,
      w: 0.32,
      h: 0.32,
      fill: { color: opts.theme.accentHex },
      line: { type: "none" },
    });
    pptxSlide.addText(String(index + 1), {
      x: opts.x + 0.15,
      y: y + 0.185,
      w: 0.32,
      h: 0.28,
      fontSize: 9.5,
      bold: true,
      color: "FFFFFF",
      align: "center",
      valign: "middle",
      fontFace: opts.theme.fontHeading,
      fit: TEXT_FIT,
    });
    pptxSlide.addText(compactText(bullet), {
      x: opts.x + 0.58,
      y: y + 0.1,
      w: opts.w - 0.76,
      h: cardH - 0.16,
      fontSize: textSize,
      bold: true,
      color: opts.theme.bodyInk,
      fontFace: opts.theme.fontBody,
      valign: "middle",
      fit: TEXT_FIT,
    });
  });

  return bullets.length * cardH + Math.max(0, bullets.length - 1) * gap;
}

function addImageBlock(
  pptxSlide: PptxGenJS.Slide,
  imageData: string,
  opts: { x: number; y: number; w: number; h: number },
): void {
  pptxSlide.addImage({
    data: imageData,
    x: opts.x,
    y: opts.y,
    w: opts.w,
    h: opts.h,
    sizing: { type: "contain", w: opts.w, h: opts.h },
  });
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
  pptx.layout = SLIDE_LAYOUT;
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

      pptxSlide.addText("PLANIFY | AULA EXECUTAVEL", {
        x: SLIDE_MARGIN_X,
        y: 0.72,
        w: SLIDE_CONTENT_W,
        h: 0.32,
        fontSize: 12,
        color: theme.coverMutedInk,
        bold: true,
        charSpacing: 2,
        fontFace: theme.fontHeading,
        fit: TEXT_FIT,
      });
      pptxSlide.addText(slide.title, {
        x: SLIDE_MARGIN_X,
        y: 1.15,
        w: SLIDE_CONTENT_W,
        h: 1.45,
        fontSize: SLIDE_COVER_TITLE_FONT,
        color: theme.coverInk,
        bold: true,
        fontFace: theme.fontHeading,
        valign: "top",
        fit: TEXT_FIT,
      });
      if (slide.subtitle) {
        pptxSlide.addText(slide.subtitle, {
          x: SLIDE_MARGIN_X,
          y: 2.65,
          w: SLIDE_CONTENT_W,
          h: 0.72,
          fontSize: SLIDE_COVER_SUBTITLE_FONT,
          color: theme.coverMutedInk,
          fontFace: theme.fontBody,
          fit: TEXT_FIT,
        });
      }
      let coverBottomY = slide.subtitle ? 3.42 : 2.72;
      pptxSlide.addText(`${ordered.length} SLIDES | GOOGLE SLIDES`, {
        x: SLIDE_MARGIN_X,
        y: coverBottomY,
        w: 4.4,
        h: 0.26,
        fontSize: 11,
        color: theme.coverMutedInk,
        charSpacing: 2,
        fit: TEXT_FIT,
      });
      coverBottomY += 0.42;

      const coverData = slide.imageUrl ? imageMap.get(slide.imageUrl) : null;
      if (coverData) {
        const imageH = Math.max(1.45, SLIDE_CONTENT_BOTTOM - coverBottomY);
        const imageW = SLIDE_CONTENT_W * 0.92;
        const imageX = (SLIDE_WIDTH_IN - imageW) / 2;
        addImageBlock(pptxSlide, coverData, {
          x: imageX,
          y: coverBottomY,
          w: imageW,
          h: imageH,
        });
      }

      if (slide.speakerNotes?.trim()) pptxSlide.addNotes(slide.speakerNotes);
      continue;
    }

    pptxSlide.background = { color: theme.contentBgHex };
    drawContentBackdrop(pptx, pptxSlide, theme, layout);

    if (layout !== "fechamento") contentCounter += 1;

    const headerLabel =
      layout === "fechamento"
        ? "SINTESE"
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
    const useSideBySide = layout === "duasColunas" && hasImage && bullets.length > 0;

    pptxSlide.addText(slide.title, {
      x: SLIDE_MARGIN_X,
      y: 0.52,
      w: SLIDE_CONTENT_W,
      h: 1.05,
      fontSize: titleFontSize,
      color: theme.titleInk,
      bold: true,
      fontFace: theme.fontHeading,
      valign: "top",
      fit: TEXT_FIT,
    });

    let contentBottomY = 1.58;
    if (slide.subtitle?.trim()) {
      pptxSlide.addText(compactText(slide.subtitle, 132), {
        x: SLIDE_MARGIN_X,
        y: 1.34,
        w: SLIDE_CONTENT_W * 0.82,
        h: 0.32,
        fontSize: 13.5,
        color: theme.mutedInk,
        fontFace: theme.fontBody,
        fit: TEXT_FIT,
      });
      contentBottomY = 1.82;
    }

    const textColumnW = useSideBySide ? 4.25 : SLIDE_CONTENT_W;

    if (bullets.length) {
      const useCards = !useSideBySide && bullets.length <= 4;
      const bulletBlockHeight = useCards
        ? addBulletCards(pptx, pptxSlide, bullets, {
            x: SLIDE_MARGIN_X,
            y: contentBottomY,
            w: textColumnW,
            bodyFontSize,
            theme,
          })
        : computeBulletBlockHeight(bullets.length);

      if (!useCards) {
        addBulletsBlock(pptxSlide, bullets, {
          x: SLIDE_MARGIN_X,
          y: contentBottomY,
          w: textColumnW,
          h: bulletBlockHeight,
          bodyFontSize,
          theme,
        });
      }
      contentBottomY += bulletBlockHeight + 0.14;
    }

    if (hasCallout && slide.callout?.text) {
      const remaining = SLIDE_CONTENT_BOTTOM - contentBottomY - 0.08;
      const calloutHeight = Math.max(0.72, Math.min(layout === "destaque" ? 1.12 : 0.95, remaining));
      const calloutW = useSideBySide ? textColumnW : SLIDE_CONTENT_W;
      if (calloutHeight >= 0.68) {
        pptxSlide.addShape(pptx.ShapeType.roundRect, {
          x: SLIDE_MARGIN_X,
          y: contentBottomY,
          w: calloutW,
          h: calloutHeight,
          fill: { color: theme.accentSoftHex },
          line: { color: theme.accentHex, width: 0.75 },
          rectRadius: 0.07,
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
                      fontSize: Math.max(15, bodyFontSize - 4),
                      breakLine: true,
                    },
                  },
                ]
              : []),
            {
              text: compactText(slide.callout.text, 148),
              options: {
                color: theme.bodyInk,
                fontSize: Math.max(17, bodyFontSize - 5),
              },
            },
          ],
          {
            x: SLIDE_MARGIN_X + 0.14,
            y: contentBottomY + 0.08,
            w: calloutW - 0.28,
            h: calloutHeight - 0.16,
            valign: "middle",
            fontFace: theme.fontBody,
            fit: TEXT_FIT,
          },
        );
        contentBottomY += calloutHeight + 0.14;
      }
    }

    if (hasImage && imageData) {
      if (useSideBySide) {
        const imageX = SLIDE_MARGIN_X + textColumnW + 0.18;
        const imageW = SLIDE_WIDTH_IN - imageX - SLIDE_MARGIN_X;
        const imageH = SLIDE_CONTENT_BOTTOM - 1.58;
        addImageBlock(pptxSlide, imageData, {
          x: imageX,
          y: 1.58,
          w: imageW,
          h: imageH,
        });
      } else {
        const imageH = computeSlideImageHeight(contentBottomY);
        const imageW = SLIDE_CONTENT_W * 0.94;
        const imageX = (SLIDE_WIDTH_IN - imageW) / 2;
        addImageBlock(pptxSlide, imageData, {
          x: imageX,
          y: contentBottomY,
          w: imageW,
          h: imageH,
        });
      }
    }

    if (slide.speakerNotes?.trim()) {
      pptxSlide.addNotes(slide.speakerNotes);
    }
    drawContentFooter(pptx, pptxSlide, theme);
  }

  const output = (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
  return Buffer.from(output);
}
