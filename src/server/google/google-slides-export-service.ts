import { exportSlidesPptxBuffer } from "../materials/slides-pptx-export-service";
import { uploadPptxAsGooglePresentation } from "./google-drive";
import { getValidGoogleAccessToken } from "./google-token-store";

export type GoogleSlidesExportInput = {
  title: string;
  html?: string;
  slides?: import("../materials/material-engine-types").MaterialEngineResponse["slides"];
  theme?: string;
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
  const { buffer: pptxBuffer, filename, slideCount } = await exportSlidesPptxBuffer(input);

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
    slideCount,
  };
}
