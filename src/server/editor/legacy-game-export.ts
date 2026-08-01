const GAME_CONTEXT_RE =
  /cruzadinha|caça-palavras|caca-palavras|bingo pedag[oó]gico|planify-jogo-visual/i;

const EXCLUDED_TABLE_CLASSES = new Set([
  "planify-game-table",
  "planify-game-clues-table",
  "planify-game-data-table",
  "planify-gabarito-table",
  "planify-cronograma-table",
  "planify-doc-meta",
]);

function isExcludedGameTable(table: Element): boolean {
  for (const className of EXCLUDED_TABLE_CLASSES) {
    if (table.classList.contains(className)) return true;
  }
  return false;
}

function isInsideGameContext(table: Element): boolean {
  if (
    table.closest(".planify-jogo-visual") ||
    table.closest(".planify-game-board") ||
    table.closest(".planify-game-section")
  ) {
    return true;
  }

  const section = table.closest("section");
  if (section && GAME_CONTEXT_RE.test(section.innerHTML)) {
    return true;
  }

  const article = table.closest("article");
  if (article?.classList.contains("planify-doc-jogo")) {
    return true;
  }

  return false;
}

function isLikelyMicroGrid(table: Element): boolean {
  const cells = [...table.querySelectorAll("td")];
  if (cells.length < 16) return false;

  const lengths = cells.map((cell) => (cell.textContent || "").replace(/\s/g, "").length);
  const maxLen = Math.max(...lengths, 0);

  // Bingo e tabelas de pontuação têm termos longos nas células.
  if (maxLen > 3) return false;

  return true;
}

function isBingoTable(table: Element): boolean {
  const headerRow = table.querySelector("tr");
  const header = (headerRow?.textContent || "").replace(/\s/g, "").toUpperCase();
  return header.includes("BING") && table.querySelectorAll("th").length >= 4;
}

function wrapInGameBoard(table: Element) {
  if (table.closest(".planify-game-board")) return;

  const board = table.ownerDocument.createElement("div");
  board.className = "planify-game-board";
  const parent = table.parentElement;
  if (!parent) return;
  parent.insertBefore(board, table);
  board.appendChild(table);
}

function classifyLegacyGridTable(table: Element) {
  let emptyCells = 0;
  let letterCells = 0;

  for (const cell of table.querySelectorAll("td")) {
    const text = (cell.textContent || "").replace(/\s/g, "");
    if (!text) {
      emptyCells += 1;
      cell.classList.add("planify-game-cell--block");
    } else if (text.length <= 2) {
      letterCells += 1;
      cell.classList.add("planify-game-cell--letter");
    }
  }

  const variant =
    emptyCells > 0 && letterCells > 0
      ? "planify-game-table--crossword"
      : "planify-game-table--wordsearch";

  table.classList.add("planify-game-table", variant);
  wrapInGameBoard(table);
}

/** Promove tabelas de jogo antigas (sem classes planify-game-*) para o markup atual de exportação. */
export function upgradeLegacyGameTables(root: Element) {
  for (const table of root.querySelectorAll("table")) {
    if (isExcludedGameTable(table)) continue;
    if (!isInsideGameContext(table)) continue;

    if (isBingoTable(table)) {
      table.classList.add("planify-game-table", "planify-game-table--bingo");
      wrapInGameBoard(table);
      continue;
    }

    if (!isLikelyMicroGrid(table)) continue;

    classifyLegacyGridTable(table);
  }
}
