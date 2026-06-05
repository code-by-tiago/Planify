import type { MaterialEngineResponse } from "../materials/material-engine-types";
import { parseSlidesFromPlanifyHtml } from "../materials/slide-html-parser";
import { buildSlidesPptxBuffer } from "../materials/slide-pptx-builder";
import { uploadPptxAsGooglePresentation } from "./google-drive";
import { getValidGoogleAccessToken } from "./google-token-store";

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

export type GoogleSlidesExportInput = {
  title: string;
  html?: string;
  slides?: MaterialEngineResponse["slides"];
};

export type GoogleSlidesExportResult = {
  drive: {
    fileId: string;
    name: string;
    webViewLink: string | null;
  };
  presentationUrl: string;
  googleEmail: string | null;
  slideCount: number;
};

export async function exportSlidesToGooglePresentations(
  userId: string,
  input: GoogleSlidesExportInput,
): Promise<GoogleSlidesExportResult> {
  const { accessToken, googleEmail } = await getValidGoogleAccessToken(userId);
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

  const pptxBuffer = await buildSlidesPptxBuffer({ title, slides });
  const filename = `${safeFilename(title)}.pptx`;

  const drive = await uploadPptxAsGooglePresentation({
    accessToken,
    filename,
    buffer: pptxBuffer,
  });

  const presentationUrl =
    drive.webViewLink?.includes("docs.google.com/presentation") ||
    drive.webViewLink?.includes("/presentation/")
      ? drive.webViewLink
      : `https://docs.google.com/presentation/d/${drive.fileId}/edit`;

  return {
    drive: { ...drive, webViewLink: presentationUrl },
    presentationUrl,
    googleEmail,
    slideCount: slides.length,
  };
}
