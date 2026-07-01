/** CSS compartilhado — editor, pré-visualização e PDF (Puppeteer). */
export const PLANIFY_GAME_EXPORT_CSS = `
  .planify-game-section {
    font-family: Arial, Helvetica, sans-serif;
    color: #111827;
    margin: 0 0 1.25rem;
  }
  .planify-game-section > h2 {
    color: #0f766e;
    font-size: 13pt;
    margin: 1rem 0 0.5rem;
  }
  .planify-game-section > h3 {
    font-size: 11.5pt;
    margin: 0.75rem 0 0.4rem;
  }
  .planify-game-board {
    display: inline-block;
    max-width: 100%;
    margin: 12px 0 16px;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .planify-game-table {
    width: auto !important;
    max-width: 100%;
    margin: 0 !important;
    border-collapse: collapse !important;
    table-layout: fixed !important;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  /*
   * Cruzadinha e caça-palavras: border-collapse em células 28–30px quebra linhas
   * no PDF do Chromium (Puppeteer). box-shadow inset desenha a grade por célula.
   */
  .planify-game-table--crossword,
  .planify-game-table--wordsearch,
  .planify-game-table--bingo {
    border-collapse: separate !important;
    border-spacing: 0 !important;
  }
  .planify-game-table td,
  .planify-game-table th {
    box-sizing: border-box;
  }
  .planify-game-cell--letter {
    width: 28px !important;
    min-width: 28px !important;
    max-width: 28px !important;
    height: 28px !important;
    min-height: 28px !important;
    padding: 0 !important;
    border: 1.5px solid #111827 !important;
    background: #ffffff !important;
    text-align: center !important;
    vertical-align: middle !important;
    font-family: Arial, Helvetica, sans-serif !important;
    font-size: 13px !important;
    font-weight: 900 !important;
    line-height: 1 !important;
    position: relative;
    overflow: visible !important;
  }
  .planify-game-table--crossword .planify-game-cell--letter,
  .planify-game-table--wordsearch .planify-game-cell--letter {
    border: none !important;
    box-shadow: inset 0 0 0 1.25px #4b5563 !important;
    -webkit-box-shadow: inset 0 0 0 1.25px #4b5563 !important;
  }
  .planify-game-cell--block {
    width: 28px !important;
    min-width: 28px !important;
    max-width: 28px !important;
    height: 28px !important;
    min-height: 28px !important;
    padding: 0 !important;
    border: 1px solid #e2e8f0 !important;
    background: #f1f5f9 !important;
  }
  .planify-game-table--crossword .planify-game-cell--block {
    border: none !important;
    box-shadow: inset 0 0 0 1px #94a3b8 !important;
    -webkit-box-shadow: inset 0 0 0 1px #94a3b8 !important;
  }
  .planify-game-cell--void {
    width: 28px !important;
    min-width: 28px !important;
    max-width: 28px !important;
    height: 28px !important;
    min-height: 28px !important;
    padding: 0 !important;
    border: none !important;
    background: transparent !important;
    box-shadow: none !important;
    -webkit-box-shadow: none !important;
  }
  .planify-game-cell-number {
    position: absolute;
    /* small inset in the cell corner to avoid overlapping the central letter */
    font-size: 7px;
    font-weight: 800;
    color: #0f766e;
    line-height: 1;
    pointer-events: none;
    user-select: none;
    z-index: 2;
  }
  .planify-game-table--wordsearch .planify-game-cell--letter {
    width: 30px !important;
    min-width: 30px !important;
    max-width: 30px !important;
    height: 30px !important;
    min-height: 30px !important;
    font-size: 14px !important;
  }
  .planify-game-clues-table {
    width: 100% !important;
    margin: 14px 0 0 !important;
    border: 1.25px solid #4b5563 !important;
    border-collapse: separate !important;
    border-spacing: 0 !important;
    table-layout: fixed !important;
  }
  .planify-game-clues-table td {
    width: 50% !important;
    padding: 8px 10px !important;
    border: none !important;
    vertical-align: top !important;
  }
  .planify-game-clues-table td + td {
    border-left: 1px solid #cbd5e1 !important;
  }
  .planify-game-clues-table h3 {
    margin: 0 0 0.35rem !important;
    font-size: 10.5pt !important;
    font-weight: 700 !important;
    color: #111827 !important;
    letter-spacing: 0 !important;
  }
  .planify-game-clues-table ol {
    margin: 0.25rem 0 0 1.1rem;
    padding: 0;
  }
  .planify-game-clues-list {
    list-style: none;
    margin: 0 !important;
    padding: 0 !important;
  }
  .planify-game-clues-list li {
    margin: 0 0 0.25rem;
    font-size: 9.7pt;
    line-height: 1.28;
  }
  .planify-crossword-compact .planify-game-section,
  .planify-crossword-print {
    margin: 0;
  }
  .planify-crossword-page {
    display: flex;
    flex-direction: column;
    min-height: 252mm;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .planify-crossword-page > h2 {
    color: #111827;
    font-size: 14pt;
    margin: 0 0 0.35rem;
    text-align: center;
  }
  .planify-crossword-instructions {
    /* removed: instruction line is not needed in printed gabarito */
    display: none !important;
    margin: 0;
  }
  .planify-crossword-compact .planify-game-board {
    display: block;
    margin: 10mm auto 12px;
    text-align: center;
  }
  .planify-crossword-compact .planify-game-table--crossword {
    margin: 0 auto !important;
  }
  .planify-crossword-compact .planify-game-table--crossword .planify-game-cell--letter,
  .planify-crossword-compact .planify-game-table--crossword .planify-game-cell--block,
  .planify-crossword-compact .planify-game-table--crossword .planify-game-cell--void {
    width: 28px !important;
    min-width: 28px !important;
    max-width: 28px !important;
    height: 28px !important;
    min-height: 28px !important;
  }
  .planify-crossword-compact .planify-crossword-print--large .planify-game-table--crossword .planify-game-cell--letter,
  .planify-crossword-compact .planify-crossword-print--large .planify-game-table--crossword .planify-game-cell--block,
  .planify-crossword-compact .planify-crossword-print--large .planify-game-table--crossword .planify-game-cell--void {
    width: 24px !important;
    min-width: 24px !important;
    max-width: 24px !important;
    height: 24px !important;
    min-height: 24px !important;
  }
  .planify-crossword-compact .planify-crossword-print--xl .planify-game-table--crossword .planify-game-cell--letter,
  .planify-crossword-compact .planify-crossword-print--xl .planify-game-table--crossword .planify-game-cell--block,
  .planify-crossword-compact .planify-crossword-print--xl .planify-game-table--crossword .planify-game-cell--void {
    width: 20px !important;
    min-width: 20px !important;
    max-width: 20px !important;
    height: 20px !important;
    min-height: 20px !important;
    font-size: 10px !important;
  }
  .planify-crossword-compact .planify-game-cell-number {
    font-size: 6px;
  }
  .planify-crossword-compact .planify-game-clues-table {
    margin: auto 0 0 !important;
    border-spacing: 0 !important;
  }
  .planify-crossword-compact .planify-game-clues-table h3 {
    font-size: 10pt !important;
    margin-bottom: 0.25rem;
  }
  .planify-crossword-answer-list {
    list-style: none;
    columns: 2;
    column-gap: 18px;
    margin: 8px 0 0;
    padding-left: 0;
  }
  .planify-crossword-answer-list li {
    break-inside: avoid;
    margin: 0 0 0.22rem;
    font-size: 9pt;
    line-height: 1.22;
  }
  .planify-game-word-bank {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 12px 0;
  }
  .planify-game-word-bank-item {
    flex: 1 1 calc(33.333% - 8px);
    min-width: 120px;
    border: 1px solid #94a3b8;
    border-radius: 8px;
    padding: 8px;
    text-align: center;
    font-weight: 700;
    background: #ffffff;
  }
  .planify-game-cards-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin: 14px 0;
  }
  .planify-game-card {
    flex: 1 1 180px;
    min-width: 160px;
    min-height: 118px;
    border: 2px dashed #334155;
    border-radius: 12px;
    padding: 12px;
    background: #ffffff;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .planify-game-card-title {
    margin: 0 0 8px;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
    color: #0f766e;
  }
  .planify-game-card-body {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    color: #111827;
  }
  .planify-game-card-footer {
    margin: 10px 0 0;
    font-size: 10px;
    color: #475569;
  }
  .planify-game-bingo-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    margin: 14px 0;
  }
  .planify-game-bingo-card {
    flex: 1 1 calc(50% - 14px);
    min-width: 240px;
    break-inside: avoid;
    page-break-inside: avoid;
    margin: 0;
    padding: 12px;
    border: 2px solid #0f172a;
    border-radius: 12px;
  }
  .planify-game-table--bingo {
    width: 100% !important;
  }
  .planify-game-table--bingo th {
    border: none !important;
    box-shadow: inset 0 0 0 1px #111827 !important;
    -webkit-box-shadow: inset 0 0 0 1px #111827 !important;
    padding: 8px !important;
    background: #e0f2fe !important;
    font-weight: 900 !important;
    text-align: center !important;
  }
  .planify-game-table--bingo td {
    height: 68px !important;
    border: none !important;
    box-shadow: inset 0 0 0 1px #111827 !important;
    -webkit-box-shadow: inset 0 0 0 1px #111827 !important;
    text-align: center !important;
    vertical-align: middle !important;
    font-size: 11px !important;
    font-weight: 700 !important;
    padding: 6px !important;
  }
  .planify-game-teacher-block {
    break-before: page;
    page-break-before: always;
    margin-top: 1.5rem;
    padding-top: 0.5rem;
  }
  .planify-game-data-table {
    width: 100% !important;
    border-collapse: collapse !important;
    margin: 12px 0 !important;
  }
  .planify-game-data-table th,
  .planify-game-data-table td {
    border: 1px solid #111827 !important;
    padding: 8px !important;
    vertical-align: top !important;
    text-align: left !important;
  }
  .planify-game-data-table th {
    background: #f8fafc !important;
    font-weight: 700 !important;
  }
`;
