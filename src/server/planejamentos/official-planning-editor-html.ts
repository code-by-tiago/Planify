import type { OfficialPlanningPayload } from "./official-planning-docx";
import {
  buildOfficialPlanningDocx,
  getOfficialPlanningFilename,
} from "./official-planning-docx";
import { convertOfficialPlanningDocxToEditorHtml } from "./official-planning-docx-to-html";

export function buildOfficialPlanningEditorHtml(
  payload: OfficialPlanningPayload,
  options?: { documentType?: string | null; documentId?: string | null },
): {
  html: string;
  filename: string;
} {
  const buffer = buildOfficialPlanningDocx(payload, options);
  const html = convertOfficialPlanningDocxToEditorHtml(buffer);

  if (
    !html.includes('data-planify-html-source="official-docx"') ||
    /<w:[a-z]/i.test(html) ||
    /&lt;w:[a-z]/i.test(html)
  ) {
    throw new Error(
      "Falha ao converter o modelo oficial para o editor (marcador ausente ou vazamento OOXML).",
    );
  }

  return {
    html,
    filename: getOfficialPlanningFilename(payload),
  };
}
