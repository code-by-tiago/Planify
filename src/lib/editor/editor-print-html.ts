import { PLANIFY_GAME_EXPORT_CSS } from "@/lib/materiais/game-export-styles";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export const PLANIFY_EXPORT_DOC_COMPONENT_CSS = `
  .planify-export-document {
    width: 100%;
    max-width: 18.6cm;
    margin: 0 auto;
  }
  .planify-doc,
  .planify-doc-ai,
  .planify-doc-professional {
    width: 100%;
  }
  @media screen {
    .planify-doc,
    .planify-doc-ai,
    .planify-doc-professional,
    .planify-export-document {
      font-family: "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
    }
  }
  .planify-doc-header {
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 0.75rem 0.9rem;
    margin: 0 0 1rem;
    background: #fafbfc;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  }
  .planify-doc-brand-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin: 0 0 0.65rem;
  }
  .planify-doc-brand {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    width: max-content;
    max-width: 100%;
    margin: 0 0 0.65rem;
    padding: 0.2rem 0.55rem 0.2rem 0.2rem;
    border-radius: 999px;
    background: #0b1f35;
    color: #ffffff;
    line-height: 1;
  }
  .planify-doc-header .planify-doc-brand {
    margin-bottom: 0;
  }
  .planify-doc-brand-mark {
    width: 34px;
    height: 34px;
    flex: 0 0 34px;
    border-radius: 999px;
    object-fit: contain;
    background: #ffffff;
    display: block;
  }
  .planify-doc-brand-name {
    font-size: 13pt;
    font-weight: 800;
    letter-spacing: 0;
    color: #ffffff;
    white-space: nowrap;
  }
  .planify-doc-kicker {
    margin: 0;
    font-size: 10pt;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #4338ca;
  }
  .planify-doc-meta {
    width: 100%;
    border-collapse: collapse;
    font-size: 10.5pt;
  }
  .planify-doc-meta th,
  .planify-doc-meta td {
    border: 1px solid #e2e8f0;
    padding: 0.35rem 0.5rem;
    text-align: left;
    vertical-align: top;
  }
  .planify-doc-meta th {
    width: 24%;
    background: #f1f5f9;
    font-weight: 600;
    color: #475569;
  }
  .planify-doc-title {
    text-align: center;
    margin-top: 0.2rem;
  }
  .planify-doc-instructions {
    border-left: 4px solid #4338ca;
    padding: 0.35rem 0 0.35rem 0.85rem;
    margin: 0 0 1rem;
    background: #eef2ff;
  }
  .planify-doc-instructions-inline {
    margin: 0 0 0.85rem;
    padding: 0.4rem 0.65rem;
    font-size: 10pt;
    color: #475569;
    border-left: 3px solid var(--planify-accent, #4338ca);
    background: #f8fafc;
  }
  .planify-doc-header-compact {
    padding: 0.5rem 0.7rem;
    margin-bottom: 0.85rem;
    border-color: #e2e8f0;
    background: #ffffff;
  }
  .planify-doc-header-teachy {
    box-shadow: none;
  }
  .planify-doc-visual > .planify-doc-brand {
    margin-bottom: 0.85rem;
  }
  .planify-doc-header-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 0.45rem;
  }
  .planify-doc-header-theme {
    margin: 0;
    font-size: 10pt;
    font-weight: 700;
    color: #334155;
    text-align: right;
  }
  .planify-doc-meta-compact th,
  .planify-doc-meta-compact td {
    font-size: 10pt;
    padding: 0.32rem 0.5rem;
  }
  .planify-doc-meta-compact th {
    width: auto;
    min-width: 4.25rem;
    white-space: nowrap;
  }
  .planify-questao-card {
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 1rem 1.1rem 1.05rem;
    margin: 0 0 1rem;
    background: #ffffff;
    box-shadow: 0 2px 6px rgba(15, 23, 42, 0.06);
  }
  .planify-questao-card-compact {
    padding: 0.95rem 1.05rem 1rem;
  }
  .planify-questao-card-compact .planify-questao-number-badge {
    margin-bottom: 0.55rem;
  }
  .planify-questao-card-compact .planify-questao-type {
    display: none;
  }
  .planify-questao-head {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    margin-bottom: 0.5rem;
  }
  .planify-questao-number-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 2rem;
    height: 2rem;
    border-radius: 999px;
    background: var(--planify-accent, #312e81);
    color: #ffffff;
    font-size: 10pt;
    font-weight: 800;
    letter-spacing: 0.02em;
    flex-shrink: 0;
  }
  .planify-questao-number-label {
    font-size: 10pt;
    font-weight: 700;
    color: #334155;
    flex: 1;
  }
  .planify-questao-number {
    font-size: 10.5pt;
    font-weight: 800;
    color: #312e81;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .planify-questao-type {
    font-size: 9pt;
    font-weight: 700;
    color: #475569;
    text-transform: uppercase;
  }
  .planify-questao-statement {
    margin: 0 0 0.65rem;
    font-weight: 500;
    line-height: 1.45;
    color: #0f172a;
  }
  .planify-questao-options {
    margin: 0.15rem 0 0.25rem 0;
    padding-left: 0;
    list-style: none;
    counter-reset: planify-option;
  }
  .planify-questao-options li {
    position: relative;
    margin: 0 0 0.4rem;
    padding-left: 1.65rem;
    line-height: 1.4;
    counter-increment: planify-option;
  }
  .planify-questao-options li::before {
    content: counter(planify-option, lower-alpha) ")";
    position: absolute;
    left: 0;
    font-weight: 700;
    color: #475569;
  }
  .planify-answer-lines span {
    display: block;
    border-bottom: 1px solid #cbd5e1;
    height: 1.5rem;
    margin-bottom: 0.55rem;
  }
  .planify-gabarito-block {
    margin-top: 1.6rem;
    padding-top: 0.85rem;
    border-top: 1px solid #e2e8f0;
  }
  .planify-gabarito-block h2 {
    font-size: 13pt;
    color: #334155;
    margin-bottom: 0.6rem;
    font-weight: 700;
  }
  .planify-gabarito-table {
    width: 100%;
    border-collapse: collapse;
    margin: 0.35rem 0 0;
    font-size: 10.5pt;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    overflow: hidden;
  }
  .planify-gabarito-table th,
  .planify-gabarito-table td {
    border: 1px solid #e2e8f0;
    padding: 0.5rem 0.65rem;
    vertical-align: top;
    text-align: left;
  }
  .planify-gabarito-table thead th {
    background: #f1f5f9;
    font-weight: 700;
    color: #475569;
    font-size: 10pt;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .planify-gabarito-num {
    width: 3.25rem;
    text-align: center;
    font-weight: 800;
    color: #312e81;
    background: #f8fafc;
  }
  .planify-gabarito-answer {
    color: #0f172a;
    line-height: 1.4;
  }
  .planify-cronograma-block {
    margin: 1.25rem 0 1.6rem;
  }
  .planify-cronograma-title {
    font-size: 13pt;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 0.65rem;
    letter-spacing: -0.01em;
  }
  .planify-cronograma-scroll {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    background: #ffffff;
  }
  .planify-cronograma-table {
    width: 100%;
    min-width: 520px;
    border-collapse: collapse;
    font-size: 10.5pt;
    line-height: 1.45;
  }
  .planify-cronograma-table thead th {
    background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
    color: #475569;
    font-weight: 700;
    font-size: 10pt;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 0.6rem 0.75rem;
    border-bottom: 2px solid #cbd5e1;
    text-align: left;
    white-space: nowrap;
  }
  .planify-cronograma-table tbody td {
    padding: 0.55rem 0.75rem;
    border-bottom: 1px solid #e2e8f0;
    vertical-align: top;
    color: #0f172a;
  }
  .planify-cronograma-table tbody tr:nth-child(even) td {
    background: #f8fafc;
  }
  .planify-cronograma-table tbody tr:last-child td {
    border-bottom: none;
  }
  .planify-cronograma-table tbody td:first-child {
    font-weight: 600;
    color: #312e81;
    white-space: nowrap;
  }
  .planify-doc-plano-aula .planify-cronograma-block,
  .planify-doc-sequencia .planify-cronograma-block,
  .planify-doc-projeto .planify-cronograma-block {
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .planify-alertas {
    border: 1px solid #fcd34d;
    background: #fffbeb;
    border-radius: 10px;
    padding: 0.65rem 0.85rem;
    margin-top: 1rem;
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
  .planify-cronograma-block,
  .planify-cronograma-table,
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
    break-inside: avoid;
    page-break-inside: avoid;
    border-radius: 14px;
    background: #ffffff;
  }
  .planify-mindmap-radial svg {
    max-height: 420px;
  }
  .planify-mindmap-chip {
    break-inside: avoid;
  }
  @media print {
    .planify-mindmap-radial svg {
      max-height: none;
    }
  }
  .planify-slide-deck {
    display: block;
  }
  .planify-doc-subtitle,
  .planify-doc-summary {
    color: #475569;
  }
  .planify-preview-prova .planify-doc-professional,
  .planify-doc-prova {
    --planify-accent: #312e81;
  }
  .planify-preview-apostila .planify-doc-professional,
  .planify-doc-apostila {
    --planify-accent: #0f766e;
  }
  .planify-preview-atividade .planify-doc-professional,
  .planify-doc-atividade {
    --planify-accent: #b45309;
  }
  .planify-preview-jogo .planify-doc-professional,
  .planify-doc-jogo {
    --planify-accent: #7c3aed;
  }
  .planify-doc-prova .planify-doc-kicker,
  .planify-doc-apostila .planify-doc-kicker,
  .planify-doc-atividade .planify-doc-kicker,
  .planify-doc-jogo .planify-doc-kicker {
    color: var(--planify-accent, #4338ca);
  }
  .planify-doc-apostila section h2 {
    border-bottom: 2px solid #ccfbf1;
    padding-bottom: 0.25rem;
  }
  .planify-atividade-card {
    border: 1px solid #fcd34d;
    border-radius: 12px;
    padding: 0.75rem 0.9rem;
    margin: 0 0 0.85rem;
    background: #fffbeb;
  }
  .planify-atividades-block > h2 {
    color: #b45309;
  }
  .planify-questoes-block-direct {
    margin-top: 0.15rem;
  }
  .planify-questoes-block-direct > .planify-questao-card:first-child {
    margin-top: 0;
  }
  .planify-preview-prova .planify-questoes-block > h2 {
    color: #312e81;
    border-bottom: 2px solid #e0e7ff;
    padding-bottom: 0.25rem;
    margin-bottom: 0.65rem;
    font-size: 13pt;
  }
  .planify-doc-lista .planify-questoes-block > h2,
  .planify-doc-prova .planify-questoes-block > h2 {
    display: none;
  }
  .planify-doc-lista .planify-doc-title,
  .planify-doc-prova .planify-doc-title,
  .planify-doc-lista .planify-doc-subtitle,
  .planify-doc-prova .planify-doc-subtitle,
  .planify-doc-lista .planify-doc-summary,
  .planify-doc-prova .planify-doc-summary {
    display: none;
  }
  .planify-resumo-section h2 {
    font-size: 12.5pt;
    color: #0f766e;
    border-bottom: 1px solid #ccfbf1;
    padding-bottom: 0.2rem;
    margin-top: 0.85rem;
  }
  .planify-resumo-section ul {
    margin: 0.35rem 0 0.5rem 1rem;
  }
  .planify-resumo-section li {
    margin-bottom: 0.25rem;
    line-height: 1.35;
  }
  .planify-resumo-lead {
    margin: 0 0 0.35rem;
    font-size: 10.5pt;
    color: #64748b;
  }
  .page-break {
    break-after: page;
    page-break-after: always;
    border: 0;
  }
`;

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
  ${PLANIFY_EXPORT_DOC_COMPONENT_CSS}
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
  table:not(.planify-game-table):not(.planify-game-clues-table):not(.planify-game-data-table) {
    width: 100%;
    border-collapse: collapse;
    margin: 0.8rem 0;
    page-break-inside: avoid;
    text-align: left;
  }
  table:not(.planify-game-table):not(.planify-game-clues-table):not(.planify-game-data-table) td,
  table:not(.planify-game-table):not(.planify-game-clues-table):not(.planify-game-data-table) th {
    border: 1px solid #cbd5e1;
    padding: 0.45rem;
    vertical-align: top;
  }
  ${PLANIFY_GAME_EXPORT_CSS}
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

import {
  SLIDE_DESIGN_HEIGHT_PX,
  SLIDE_DESIGN_WIDTH_PX,
  SLIDE_EXPORT_INNER_SCALE,
  SLIDE_EXPORT_PAGE_HEIGHT_MM,
  SLIDE_EXPORT_PAGE_WIDTH_MM,
} from "@/lib/slides/slide-layout";

export const PLANIFY_SLIDE_EXPORT_CSS = `
  @page {
    size: ${SLIDE_EXPORT_PAGE_WIDTH_MM}mm ${SLIDE_EXPORT_PAGE_HEIGHT_MM}mm;
    margin: 0;
  }
  html, body, * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  html, body {
    margin: 0;
    padding: 0;
    background: #ffffff;
    color: #0f172a;
  }
  .planify-export-document {
    width: ${SLIDE_EXPORT_PAGE_WIDTH_MM}mm;
    max-width: none;
    margin: 0;
    padding: 0;
  }
  .planify-slide-deck {
    display: block;
    margin: 0 !important;
    padding: 0 !important;
    background: transparent !important;
    border-radius: 0 !important;
  }
  .planify-slide-deck > p:first-of-type {
    display: none !important;
  }
  .planify-slide {
    display: block;
    position: relative;
    width: ${SLIDE_EXPORT_PAGE_WIDTH_MM}mm !important;
    height: ${SLIDE_EXPORT_PAGE_HEIGHT_MM}mm !important;
    min-height: ${SLIDE_EXPORT_PAGE_HEIGHT_MM}mm !important;
    max-width: none !important;
    margin: 0 !important;
    padding: 0 !important;
    border: 0 !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    overflow: hidden !important;
    box-sizing: border-box;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .planify-slide:not(:last-of-type) {
    page-break-after: always;
    break-after: page;
  }
  .planify-slide:last-of-type {
    page-break-after: avoid;
    break-after: avoid;
  }
  .planify-slide-export-inner {
    position: absolute;
    top: 0;
    left: 0;
    width: ${SLIDE_DESIGN_WIDTH_PX}px;
    height: ${SLIDE_DESIGN_HEIGHT_PX}px;
    transform: scale(${SLIDE_EXPORT_INNER_SCALE.toFixed(4)});
    transform-origin: top left;
    box-sizing: border-box;
  }
  .planify-slide-export-inner > div[style*="padding"] {
    height: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
  }
  .planify-slide figure img,
  .planify-slide-image {
    max-height: 280px !important;
    object-fit: contain !important;
  }
  img {
    max-width: 100%;
    height: auto;
    display: block;
  }
  [contenteditable],
  button,
  input,
  select,
  textarea {
    outline: 0 !important;
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

export function wrapAsSlideExportHtml(title: string, body: string) {
  const safeTitle = escapeHtml(title || "Apresentação Planify");

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>${safeTitle}</title>
  <meta name="Generator" content="Planify" />
  <style>${PLANIFY_SLIDE_EXPORT_CSS}</style>
</head>
<body>
  <main class="planify-export-document">
    ${body}
  </main>
</body>
</html>`;
}
