import { convertSimpleDocxToHtml } from "@/server/docx/simple-docx-to-html";

const OFFICIAL_EDITOR_STYLES = `
  .planify-planning-official{font-family:Arial,Helvetica,sans-serif;font-size:11pt;line-height:1.35;color:#111827}
  .planify-planning-official table{width:100%;border-collapse:collapse;margin:10px 0 16px;table-layout:fixed}
  .planify-planning-official th,.planify-planning-official td{border:1px solid #111827;padding:6px 8px;vertical-align:top;word-wrap:break-word}
  .planify-planning-official p{margin:8px 0}
`;

/** Converte o DOCX oficial preenchido (mesmo da exportação) em HTML para o editor. */
export function convertOfficialPlanningDocxToEditorHtml(buffer: Buffer): string {
  const inner = convertSimpleDocxToHtml(buffer, "Planejamento");
  const bodyInner = inner
    .replace(/^<article[^>]*>/, "")
    .replace(/<\/article>\s*$/, "");

  return `<article class="planify-doc planify-planning-official" data-planify-html-source="official-docx">
<style>${OFFICIAL_EDITOR_STYLES}</style>
${bodyInner}
</article>`;
}
