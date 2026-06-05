import PptxGenJS from "pptxgenjs";
import type { MaterialEngineResponse } from "./material-engine-types";
import { assignSlideSequenceLabels, orderSlidesPedagogically } from "./slide-pedagogy";

type SlideItem = NonNullable<MaterialEngineResponse["slides"]>[number];

const ACCENT_HEX: Record<string, string> = {
  indigo: "4F46E5",
  violet: "7C3AED",
  coral: "F43F5E",
  amber: "D97706",
  emerald: "059669",
  sky: "0284C7",
  rose: "E11D48",
};

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
async function preloadImages(
  slides: SlideItem[],
): Promise<Map<string, string>> {
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

export async function buildSlidesPptxBuffer(input: {
  title: string;
  slides: SlideItem[];
}): Promise<Buffer> {
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
    const accent = ACCENT_HEX[slide.accentColor || "indigo"] || ACCENT_HEX.indigo;
    const pptxSlide = pptx.addSlide();

    if (layout === "capa") {
      pptxSlide.background = { color: accent };
      pptxSlide.addText("Planify · Apresentação", {
        x: 0.6,
        y: 1.2,
        w: 11.5,
        h: 0.4,
        fontSize: 11,
        color: "FFFFFF",
        bold: true,
      });
      pptxSlide.addText(slide.title, {
        x: 0.6,
        y: 1.8,
        w: 11.5,
        h: 1.4,
        fontSize: 30,
        color: "FFFFFF",
        bold: true,
      });
      if (slide.subtitle) {
        pptxSlide.addText(slide.subtitle, {
          x: 0.6,
          y: 3.2,
          w: 11,
          h: 0.8,
          fontSize: 16,
          color: "FFFFFF",
        });
      }
      pptxSlide.addText(`${ordered.length} slides`, {
        x: 0.6,
        y: 6.5,
        w: 4,
        h: 0.3,
        fontSize: 11,
        color: "FFFFFF",
      });

      const coverData = slide.imageUrl ? imageMap.get(slide.imageUrl) : null;
      if (coverData) {
        pptxSlide.addImage({
          data: coverData,
          x: 7.7,
          y: 1.4,
          w: 4.7,
          h: 3.6,
          sizing: { type: "cover", w: 4.7, h: 3.6 },
        });
      }

      if (slide.speakerNotes?.trim()) pptxSlide.addNotes(slide.speakerNotes);
      continue;
    }

    if (layout !== "fechamento") contentCounter += 1;

    const headerLabel =
      layout === "fechamento"
        ? "SÍNTESE"
        : (slide.sequenceLabel || `Etapa ${contentCounter}`).toUpperCase();
    const positionLabel =
      layout === "fechamento"
        ? "Fechamento"
        : `${contentCounter} / ${contentTotal}`;

    pptxSlide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 0.16,
      h: 7.5,
      fill: { color: accent },
      line: { type: "none" },
    });

    pptxSlide.addText(headerLabel, {
      x: 0.45,
      y: 0.25,
      w: 7,
      h: 0.35,
      fontSize: 10,
      color: accent,
      bold: true,
    });
    pptxSlide.addText(positionLabel, {
      x: 9.5,
      y: 0.25,
      w: 2.5,
      h: 0.35,
      fontSize: 10,
      color: "64748B",
      align: "right",
    });

    pptxSlide.addText(slide.title, {
      x: 0.5,
      y: 0.75,
      w: 12,
      h: 0.7,
      fontSize: 22,
      color: "0F172A",
      bold: true,
    });

    const bullets = (slide.bullets || []).filter((item) => item.trim());
    const imageData = slide.imageUrl ? imageMap.get(slide.imageUrl) : null;
    const hasImage = Boolean(imageData);
    const textWidth = hasImage && layout !== "destaque" ? 5.9 : 11.8;

    if (bullets.length) {
      pptxSlide.addText(
        bullets.map((text) => ({
          text,
          options: {
            bullet: { indent: 18, characterCode: "2022" },
            paraSpaceAfter: 8,
          },
        })),
        {
          x: 0.55,
          y: 1.55,
          w: textWidth,
          h: 4.2,
          fontSize: 15,
          color: "334155",
          valign: "top",
          lineSpacingMultiple: 1.15,
        },
      );
    }

    if (slide.callout?.text) {
      pptxSlide.addText(slide.callout.title || "Destaque", {
        x: 0.55,
        y: 5.5,
        w: textWidth,
        h: 0.3,
        fontSize: 11,
        color: accent,
        bold: true,
      });
      pptxSlide.addText(slide.callout.text, {
        x: 0.55,
        y: 5.85,
        w: textWidth,
        h: 0.8,
        fontSize: 12,
        color: "475569",
      });
    }

    if (hasImage && imageData) {
      const imageX = layout === "destaque" ? 3.5 : 6.7;
      const imageY = layout === "destaque" ? 2.8 : 1.55;
      const imageW = layout === "destaque" ? 6 : 5.6;
      const imageH = layout === "destaque" ? 3 : 3.9;
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
