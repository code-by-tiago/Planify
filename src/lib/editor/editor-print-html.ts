function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export const PLANIFY_EXPORT_CSS = `
  @page { size: A4 portrait; margin: 1.2cm; }
  html, body, * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  html, body { background: #ffffff; color: #0f172a; margin: 0; }
  body {
    font-family: "Times New Roman", Times, serif;
    font-size: 12pt;
    line-height: 1.5;
    text-align: left;
  }
  .planify-export-document {
    width: 100%;
    max-width: 18.6cm;
    margin: 0 auto;
  }
  .planify-doc,
  .planify-doc-ai {
    width: 100%;
  }
  h1, h2, h3, h4 {
    color: #0f172a;
    line-height: 1.2;
    page-break-after: avoid;
    text-align: left;
  }
  h1 {
    font-size: 14pt;
    margin: 0 0 1rem;
  }
  h2 {
    font-size: 13pt;
    margin: 1.1rem 0 0.65rem;
  }
  h3, h4 {
    font-size: 12pt;
    margin: 0.9rem 0 0.5rem;
  }
  p {
    margin: 0 0 0.65rem;
  }
  ul, ol {
    margin: 0 0 0.65rem 1.2rem;
    padding: 0;
  }
  li {
    margin: 0 0 0.35rem;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 0.8rem 0;
    page-break-inside: avoid;
    text-align: left;
  }
  td, th {
    border: 1px solid #cbd5e1;
    padding: 0.45rem;
    vertical-align: top;
  }
  figure,
  img,
  table,
  blockquote,
  .planify-game-card,
  .planify-game-board,
  .planify-bingo-card,
  .planify-memory-card,
  .planify-domino-piece,
  .planify-flashcard,
  .planify-flashcards,
  .planify-slide,
  .planify-slide-deck,
  .planify-questao,
  .planify-mindmap,
  .planify-mindmap-branch,
  .planify-etapa,
  .planify-section-visual,
  .planify-jogo-visual,
  .planify-alertas {
    break-inside: avoid;
    page-break-inside: avoid;
  }
  img {
    max-width: 100%;
    height: auto;
    display: block;
  }
  .planify-flashcards {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }
  .planify-flashcard {
    display: flex;
    flex-direction: column;
    flex: 1 1 260px;
    min-width: 240px;
    max-width: 340px;
    border-radius: 16px;
    overflow: hidden;
    background: #ffffff;
  }
  .planify-flashcard > div:first-child {
    color: #ffffff !important;
  }
  .planify-mindmap-branch {
    border-radius: 14px;
    background: #ffffff;
  }
  .planify-slide-deck {
    display: block;
  }
  .planify-doc-subtitle,
  .planify-doc-summary {
    color: #475569;
  }
  .page-break {
    break-after: page;
    page-break-after: always;
    border: 0;
  }
  [contenteditable],
  button,
  input,
  select,
  textarea {
    outline: 0 !important;
  }
  @media print {
    html, body {
      width: 210mm;
      min-height: 297mm;
    }
    .planify-export-document {
      max-width: none;
    }
  }
`;

export function wrapAsPlanifyExportHtml(
  title: string,
  body: string,
  options?: { autoPrint?: boolean },
) {
  const safeTitle = escapeHtml(title || "Documento Planify");
  const autoPrintScript = options?.autoPrint
    ? `<script>
    window.addEventListener("load", function () {
      window.setTimeout(function () { window.print(); }, 250);
    });
  </script>`
    : "";

  return `<!doctype html>
<html lang="pt-BR" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head>
  <meta charset="utf-8" />
  <title>${safeTitle}</title>
  <meta name="ProgId" content="Word.Document" />
  <meta name="Generator" content="Planify" />
  <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->
  <style>${PLANIFY_EXPORT_CSS}</style>
</head>
<body>
  <main class="planify-export-document">
    ${body}
  </main>
  ${autoPrintScript}
</body>
</html>`;
}

export function wrapAsCleanPrintHtml(
  title: string,
  body: string,
  options?: { autoPrint?: boolean },
) {
  return wrapAsPlanifyExportHtml(title, body, options);
}
