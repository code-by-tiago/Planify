/** CSS de tela para prévia na Comunidade — não usar estilos de impressão/export (mm fixos). */

export const PLANIFY_COMMUNITY_DOCUMENT_PREVIEW_CSS = `
  .planify-community-material-html .planify-export-document,
  .planify-community-material-html .planify-doc,
  .planify-community-material-html .planify-doc-ai,
  .planify-community-material-html .planify-doc-professional,
  .planify-community-material-html .planify-doc {
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 auto !important;
    box-sizing: border-box !important;
  }
  .planify-community-material-html img,
  .planify-community-material-html video,
  .planify-community-material-html svg,
  .planify-community-material-html iframe {
    max-width: 100% !important;
    height: auto !important;
  }
  .planify-community-material-html table {
    display: block !important;
    width: 100% !important;
    max-width: 100% !important;
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch !important;
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
