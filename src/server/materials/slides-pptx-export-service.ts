import type { MaterialEngineResponse } from "./material-engine-types";
import {
  extractSlideThemeFromHtml,
  parseSlidesFromPlanifyHtml,
} from "./slide-html-parser";
import { buildSlidesPptxBuffer } from "./slide-pptx-builder";

function safeFilename(value: string): string {
  const cleaned = String(value || "apresentacao-planify")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 80);

  return cleaned || "apresentacao-planify";
}

export type SlidesPptxExportInput = {
  title: string;
  html?: string;
  slides?: MaterialEngineResponse["slides"];
  theme?: string;
};

export type SlidesPptxExportResult = {
  buffer: Buffer;
  filename: string;
  slideCount: number;
  contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation";
};

export async function exportSlidesPptxBuffer(
  input: SlidesPptxExportInput,
): Promise<SlidesPptxExportResult> {
  const title = String(input.title || "Apresentação Planify").trim() || "Apresentação Planify";

  let slides = input.slides?.filter((slide) => slide?.title?.trim()) ?? [];

  if (!slides.length && input.html?.trim()) {
    slides = parseSlidesFromPlanifyHtml(input.html);
  }

  if (!slides.length) {
    throw new Error(
      "Não foi possível montar os slides. Gere a apresentação novamente no Planify.",
    );
  }

  const themeId =
    input.theme?.trim() ||
    (input.html ? extractSlideThemeFromHtml(input.html) : undefined);

  const buffer = await buildSlidesPptxBuffer({ title, slides, themeId });
  const filename = `${safeFilename(title)}.pptx`;

  return {
    buffer,
    filename,
    slideCount: slides.length,
    contentType:
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  };
}
