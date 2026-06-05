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
      headers: { "User-Agent": "Planify/1.0" },
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length < 200 || buffer.length > 4_000_000) return null;

    const base64 = buffer.toString("base64");
    const mime = contentType.split(";")[0].trim();
    return `image/${mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpeg"};base64,${base64}`;
  } catch {
    return null;
  }
}

export async function buildSlidesPptxBuffer(input: {
  title: string;
  slides: SlideItem[];
}): Promise<Buffer> {
  const ordered = orderSlidesPedagogically([...input.slides]);
  assignSlideSequenceLabels(ordered);

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

      if (slide.imageUrl) {
        const data = await fetchImageDataUrl(slide.imageUrl);
        if (data) {
          pptxSlide.addImage({ data, x: 7.8, y: 1.5, w: 4.5, h: 3.2, sizing: { type: "cover", w: 4.5, h: 3.2 } });
        }
      }
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
    const hasImage = Boolean(slide.imageUrl?.trim());
    const textWidth = hasImage && layout !== "destaque" ? 5.8 : 11.5;

    if (bullets.length) {
      pptxSlide.addText(bullets.join("\n"), {
        x: 0.55,
        y: 1.55,
        w: textWidth,
        h: 4.2,
        fontSize: 14,
        color: "334155",
        valign: "top",
        bullet: true,
      });
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

    if (hasImage && slide.imageUrl) {
      const data = await fetchImageDataUrl(slide.imageUrl);
      if (data) {
        const imageX = layout === "destaque" ? 3.5 : 6.6;
        const imageY = layout === "destaque" ? 2.8 : 1.55;
        const imageW = layout === "destaque" ? 6 : 5.5;
        const imageH = layout === "destaque" ? 3 : 3.8;
        pptxSlide.addImage({
          data,
          x: imageX,
          y: imageY,
          w: imageW,
          h: imageH,
          sizing: { type: "cover", w: imageW, h: imageH },
        });
      }
    }

    if (slide.speakerNotes?.trim()) {
      pptxSlide.addNotes(slide.speakerNotes);
    }
  }

  const output = (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
  return Buffer.from(output);
}
