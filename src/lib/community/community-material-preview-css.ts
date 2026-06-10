/** CSS de tela para prévia na Comunidade — espelha tipografia do editor (planify-editor-page). */

export const PLANIFY_COMMUNITY_DOCUMENT_SCREEN_CSS = `
  .planify-community-material-document {
    font-family: "Times New Roman", Times, serif;
    font-size: 12pt;
    line-height: 1.5;
    color: #0f172a;
    width: 100%;
    max-width: 21cm;
    margin: 0 auto;
    box-sizing: border-box;
  }
  .planify-community-material-document .planify-doc,
  .planify-community-material-document .planify-doc-ai,
  .planify-community-material-document .planify-doc-professional,
  .planify-community-material-document .planify-export-document {
    width: 100%;
    max-width: 100%;
    margin: 0 auto;
    box-sizing: border-box;
  }
  .planify-community-material-document h1 {
    font-size: 2rem;
    font-weight: 800;
    margin: 0 0 1rem;
    color: #0f172a;
    line-height: 1.2;
  }
  .planify-community-material-document h2 {
    font-size: 1.55rem;
    font-weight: 800;
    margin: 1.25rem 0 0.75rem;
    color: #0f172a;
    line-height: 1.2;
  }
  .planify-community-material-document h3 {
    font-size: 1.25rem;
    font-weight: 800;
    margin: 1rem 0 0.5rem;
    color: #0f172a;
    line-height: 1.2;
  }
  .planify-community-material-document p {
    margin: 0.65rem 0;
  }
  .planify-community-material-document ul,
  .planify-community-material-document ol {
    margin: 0.75rem 0;
    padding-left: 1.5rem;
  }
  .planify-community-material-document table {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0;
  }
  .planify-community-material-document td,
  .planify-community-material-document th {
    border: 1px solid #cbd5e1;
    padding: 0.55rem;
    vertical-align: top;
  }
  .planify-community-material-document img,
  .planify-community-material-document video,
  .planify-community-material-document svg,
  .planify-community-material-document iframe {
    max-width: 100%;
    height: auto;
  }
  .planify-community-material-document pre {
    max-width: 100%;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .planify-community-material-document .planify-flashcards {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }
  .planify-community-material-document .planify-flashcard {
    flex: 1 1 260px;
    min-width: 0;
    max-width: 100%;
  }
  @media (max-width: 640px) {
    .planify-community-material-document table {
      display: block;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      max-width: 100%;
    }
    .planify-community-material-document td,
    .planify-community-material-document th {
      min-width: 72px;
      font-size: 0.85rem;
      padding: 0.4rem;
    }
    .planify-community-material-document .planify-flashcards {
      flex-direction: column;
      gap: 12px;
    }
    .planify-community-material-document .planify-flashcard {
      flex: none;
      width: 100%;
    }
  }
`;

/** Layout responsivo compartilhado (slides e documentos). */
export const PLANIFY_COMMUNITY_DOCUMENT_PREVIEW_CSS = `
  .planify-community-material-html img,
  .planify-community-material-html video,
  .planify-community-material-html svg,
  .planify-community-material-html iframe {
    max-width: 100% !important;
    height: auto !important;
  }
  .planify-community-material-html pre {
    max-width: 100% !important;
    overflow-x: auto !important;
    white-space: pre-wrap !important;
    word-break: break-word !important;
  }
`;

export const PLANIFY_COMMUNITY_SLIDE_PREVIEW_CSS = `
  .planify-community-material-slides .planify-export-document {
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  .planify-community-material-slides .planify-slide-deck {
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    background: transparent !important;
    border-radius: 0 !important;
  }
  .planify-community-material-slides .planify-slide-deck > p:first-of-type {
    margin-bottom: 0.75rem !important;
    font-size: 0.75rem !important;
  }
  .planify-community-material-slides .planify-slide {
    width: 100% !important;
    max-width: 100% !important;
    height: auto !important;
    min-height: unset !important;
    margin: 0 0 1rem !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
    border-radius: 0.75rem !important;
  }
  .planify-community-material-slides .planify-slide[style] {
    width: 100% !important;
    max-width: 100% !important;
  }
  .planify-community-material-slides .planify-slide > div[style*="padding"] {
    padding: clamp(12px, 3vw, 24px) !important;
    box-sizing: border-box !important;
  }
  .planify-community-material-slides .planify-slide h1,
  .planify-community-material-slides .planify-slide h2,
  .planify-community-material-slides .planify-slide h3,
  .planify-community-material-slides .planify-slide p,
  .planify-community-material-slides .planify-slide li {
    overflow-wrap: anywhere !important;
    word-break: break-word !important;
  }
  .planify-community-material-slides .planify-slide:has(.planify-slide-export-inner) {
    position: relative !important;
    aspect-ratio: 16 / 9 !important;
    padding: 0 !important;
    container-type: inline-size !important;
    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08) !important;
    border: 1px solid #e2e8f0 !important;
  }
  .planify-community-material-slides .planify-slide-export-inner {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    width: 720px !important;
    height: 405px !important;
    transform: scale(calc(100cqw / 720px)) !important;
    transform-origin: top left !important;
  }
  .planify-community-material-slides .planify-slide figure img,
  .planify-community-material-slides .planify-slide-image {
    max-width: 100% !important;
    height: auto !important;
    object-fit: contain !important;
  }
`;
