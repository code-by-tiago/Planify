import {
  getMaterialGameFormatLabel,
  getMaterialGameFormatRule,
  normalizeGameItemCount,
  type MaterialGameFormat,
} from "../../../config/material-game-types";
import { getMaterialTypeLabel } from "../../../config/material-credits";
import type {
  MaterialGeneratedActivity,
  MaterialGeneratedQuestion,
  MaterialGeneratorRequest,
  PlanifyGeneratedMaterial,
} from "../../../types/material-generator";
import { sanitizeMaterialHtml } from "../material-html";

export type MaterialGameBlueprintItem = {
  termo?: string;
  resposta?: string;
  pista?: string;
  definicao?: string;
  pergunta?: string;
  alternativas?: string[];
  respostaCorreta?: string;
  desafio?: string;
  categoria?: string;
  justificativa?: string;
};

export type MaterialGameBlueprint = {
  titulo: string;
  subtitulo?: string;
  resumo?: string;
  objetivoPedagogico: string;
  contextualizacao?: string;
  formato: string;
  tempoEstimado?: string;
  organizacao?: string;
  materiais?: string[];
  preparacao?: string[];
  regras?: string[];
  comoJogar?: string[];
  pontuacao?: string[];
  fechamento?: string[];
  adaptacoesInclusivas?: string[];
  criteriosAvaliacao?: string[];
  itens: MaterialGameBlueprintItem[];
};

type GameTable = {
  title: string;
  headers: string[];
  rows: string[][];
};

type GameArtifact = {
  format: MaterialGameFormat;
  title: string;
  studentSections: string[];
  teacherSections: string[];
  tables: GameTable[];
  questions: MaterialGeneratedQuestion[];
  answers: Array<{ questao: number; resposta: string }>;
};

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeGameWord(value: unknown): string {
  return stripAccents(String(value ?? ""))
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 18);
}

function toText(value: unknown, fallback = ""): string {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

function compactArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => toText(item)).filter(Boolean);
}

function uniqueBy<T>(items: T[], getKey: (item: T) => string): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const item of items) {
    const key = getKey(item).toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result;
}

function hashSeed(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return hash >>> 0;
}

function seededRandom(seed: number) {
  let state = seed || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function shuffle<T>(items: T[], seedText: string): T[] {
  const random = seededRandom(hashSeed(seedText));
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function normalizeBlueprintItems(blueprint: MaterialGameBlueprint, input: MaterialGeneratorRequest): Required<MaterialGameBlueprintItem>[] {
  const fallbackTerms = [
    input.temaCentral,
    input.componenteCurricular,
    input.anoSerie,
    "conceito",
    "exemplo",
    "analise",
    "aprendizagem",
    "contexto",
    "revisao",
    "argumento",
    "evidencia",
    "desafio",
  ];

  const raw = Array.isArray(blueprint.itens) && blueprint.itens.length > 0
    ? blueprint.itens
    : fallbackTerms.map((term) => ({ termo: term, definicao: `Conceito relacionado a ${input.temaCentral}.` }));

  return uniqueBy(raw, (item) => item.termo || item.resposta || item.respostaCorreta || item.pergunta || item.desafio || "")
    .map((item, index) => {
      const termo = toText(item.termo || item.resposta || item.respostaCorreta || `Item ${index + 1}`);
      const definicao = toText(item.definicao || item.justificativa || item.pista, `Conceito importante sobre ${input.temaCentral}.`);
      const pergunta = toText(item.pergunta || item.desafio || `Explique a relação entre ${termo} e ${input.temaCentral}.`);
      const respostaCorreta = toText(item.respostaCorreta || item.resposta || termo);
      const pista = toText(item.pista || definicao || pergunta);
      const categoria = toText(item.categoria || input.componenteCurricular);
      const alternativas = compactArray(item.alternativas);

      return {
        termo,
        resposta: respostaCorreta,
        pista,
        definicao,
        pergunta,
        alternativas,
        respostaCorreta,
        desafio: toText(item.desafio || pergunta),
        categoria,
        justificativa: toText(item.justificativa || definicao),
      };
    });
}

const palette = {
  section: "margin: 28px 0; padding: 22px; border: 1px solid #dbeafe; border-radius: 18px; background: #ffffff; page-break-inside: avoid; break-inside: avoid;",
  teacher: "margin: 28px 0; padding: 22px; border: 1px solid #fde68a; border-radius: 18px; background: #fffbeb; page-break-inside: avoid; break-inside: avoid;",
  title: "margin: 0 0 14px; color: #0f172a; font-size: 20px; line-height: 1.25;",
  text: "margin: 0 0 12px; color: #334155; line-height: 1.65;",
  table: "width: 100%; border-collapse: collapse; margin: 16px 0 8px; font-size: 13px;",
  th: "border: 1px solid #cbd5e1; padding: 10px; background: #f8fafc; color: #0f172a; text-align: left; vertical-align: top; font-weight: 800;",
  td: "border: 1px solid #cbd5e1; padding: 10px; color: #0f172a; vertical-align: top;",
};

function sectionHtml(title: string, content: string, variant: "student" | "teacher" | "neutral" = "neutral"): string {
  if (!content.trim()) return "";
  const style = variant === "teacher" ? palette.teacher : palette.section;
  return `<section style="${style}"><h2 style="${palette.title}">${escapeHtml(title)}</h2>${content}</section>`;
}

function tableHtml(table: GameTable): string {
  const head = `<thead><tr>${table.headers.map((header) => `<th style="${palette.th}">${escapeHtml(header)}</th>`).join("")}</tr></thead>`;
  const body = `<tbody>${table.rows
    .map((row) => `<tr>${row.map((cell) => `<td style="${palette.td}">${escapeHtml(cell)}</td>`).join("")}</tr>`)
    .join("")}</tbody>`;

  return `<div style="margin: 18px 0;"><h3 style="margin: 0 0 10px; color: #0f172a; font-size: 16px;">${escapeHtml(table.title)}</h3><table style="${palette.table}">${head}${body}</table></div>`;
}

function listHtml(title: string, items: string[], variant: "student" | "teacher" | "neutral" = "neutral"): string {
  if (!items.length) return "";
  const content = `<ul style="margin: 0; padding-left: 22px; color: #334155; line-height: 1.7;">${items.map((item) => `<li style="margin: 7px 0;">${escapeHtml(item)}</li>`).join("")}</ul>`;
  return sectionHtml(title, content, variant);
}

function paragraphSection(title: string, text: string, variant: "student" | "teacher" | "neutral" = "neutral"): string {
  if (!text) return "";
  return sectionHtml(title, `<p style="${palette.text}">${escapeHtml(text)}</p>`, variant);
}

function gridToTableHtml(title: string, grid: string[][], revealLetters: boolean): string {
  const rows = grid
    .map((row) => `<tr>${row.map((cell) => {
      const isEmpty = !cell || cell === "#";
      const content = isEmpty ? "" : revealLetters ? escapeHtml(cell) : "";
      const marker = isEmpty ? "■" : content || "&nbsp;";
      const bg = isEmpty ? "#e2e8f0" : "#ffffff";
      return `<td style="border:1px solid #94a3b8; width:28px; height:28px; text-align:center; vertical-align:middle; font-family:Arial, sans-serif; font-size:14px; font-weight:800; background:${bg}; color:#0f172a;">${marker}</td>`;
    }).join("")}</tr>`)
    .join("");

  return `<div style="margin: 18px 0; overflow-x:auto;"><h3 style="margin: 0 0 12px; color: #0f172a; font-size: 16px;">${escapeHtml(title)}</h3><table style="border-collapse: collapse; margin: 0 auto 12px; width: auto;"><tbody>${rows}</tbody></table></div>`;
}

function buildWordSearchGrid(words: string[], seedText: string): string[][] {
  const normalized = words.map(normalizeGameWord).filter((word) => word.length >= 3);
  const size = Math.max(12, Math.min(22, Math.max(...normalized.map((word) => word.length), 12) + 4));
  const grid = Array.from({ length: size }, () => Array.from({ length: size }, () => ""));
  const random = seededRandom(hashSeed(seedText));
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [-1, 1],
  ];

  function canPlace(word: string, row: number, col: number, dr: number, dc: number) {
    for (let i = 0; i < word.length; i += 1) {
      const r = row + dr * i;
      const c = col + dc * i;
      if (r < 0 || c < 0 || r >= size || c >= size) return false;
      if (grid[r][c] && grid[r][c] !== word[i]) return false;
    }
    return true;
  }

  for (const word of normalized) {
    let placed = false;
    const shuffledDirections = shuffle(directions, `${seedText}-${word}`);

    for (let attempt = 0; attempt < 250 && !placed; attempt += 1) {
      const [dr, dc] = shuffledDirections[attempt % shuffledDirections.length];
      const row = Math.floor(random() * size);
      const col = Math.floor(random() * size);

      if (!canPlace(word, row, col, dr, dc)) continue;

      for (let i = 0; i < word.length; i += 1) {
        grid[row + dr * i][col + dc * i] = word[i];
      }
      placed = true;
    }
  }

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (!grid[row][col]) {
        grid[row][col] = ALPHABET[Math.floor(random() * ALPHABET.length)];
      }
    }
  }

  return grid;
}

function buildCrossword(items: Required<MaterialGameBlueprintItem>[], seedText: string) {
  const words = items
    .map((item) => ({ word: normalizeGameWord(item.resposta || item.termo), clue: item.pista || item.definicao }))
    .filter((item) => item.word.length >= 3)
    .slice(0, 16);

  const size = 19;
  const grid = Array.from({ length: size }, () => Array.from({ length: size }, () => "#"));
  const placements: Array<{ number: number; word: string; clue: string; row: number; col: number; direction: "horizontal" | "vertical" }> = [];
  const random = seededRandom(hashSeed(seedText));

  function canPlace(word: string, row: number, col: number, direction: "horizontal" | "vertical") {
    for (let i = 0; i < word.length; i += 1) {
      const r = row + (direction === "vertical" ? i : 0);
      const c = col + (direction === "horizontal" ? i : 0);
      if (r < 0 || c < 0 || r >= size || c >= size) return false;
      if (grid[r][c] !== "#" && grid[r][c] !== word[i]) return false;
    }
    return true;
  }

  function place(word: string, clue: string, row: number, col: number, direction: "horizontal" | "vertical") {
    for (let i = 0; i < word.length; i += 1) {
      const r = row + (direction === "vertical" ? i : 0);
      const c = col + (direction === "horizontal" ? i : 0);
      grid[r][c] = word[i];
    }
    placements.push({ number: placements.length + 1, word, clue, row, col, direction });
  }

  words.forEach((item, index) => {
    const direction = index % 2 === 0 ? "horizontal" : "vertical";

    if (index === 0) {
      const row = Math.floor(size / 2);
      const col = Math.max(0, Math.floor((size - item.word.length) / 2));
      if (canPlace(item.word, row, col, direction)) place(item.word, item.clue, row, col, direction);
      return;
    }

    let placed = false;

    for (const existing of placements) {
      for (let i = 0; i < item.word.length && !placed; i += 1) {
        const target = item.word[i];
        for (let j = 0; j < existing.word.length && !placed; j += 1) {
          if (existing.word[j] !== target) continue;
          const crossingRow = existing.row + (existing.direction === "vertical" ? j : 0);
          const crossingCol = existing.col + (existing.direction === "horizontal" ? j : 0);
          const nextDirection = existing.direction === "horizontal" ? "vertical" : "horizontal";
          const row = crossingRow - (nextDirection === "vertical" ? i : 0);
          const col = crossingCol - (nextDirection === "horizontal" ? i : 0);

          if (canPlace(item.word, row, col, nextDirection)) {
            place(item.word, item.clue, row, col, nextDirection);
            placed = true;
          }
        }
      }
    }

    for (let attempt = 0; attempt < 80 && !placed; attempt += 1) {
      const nextDirection = attempt % 2 === 0 ? direction : direction === "horizontal" ? "vertical" : "horizontal";
      const row = Math.floor(random() * size);
      const col = Math.floor(random() * size);
      if (canPlace(item.word, row, col, nextDirection)) {
        place(item.word, item.clue, row, col, nextDirection);
        placed = true;
      }
    }
  });

  return { grid, placements };
}

function makeQuestionsFromItems(items: Required<MaterialGameBlueprintItem>[], input: MaterialGeneratorRequest): MaterialGeneratedQuestion[] {
  return items.slice(0, Math.max(5, Math.min(30, input.quantidadeQuestoes || 10))).map((item, index) => ({
    numero: index + 1,
    tipo: "jogo_pedagogico",
    enunciado: item.pergunta || item.desafio || `Explique ${item.termo}.`,
    alternativas: item.alternativas || [],
    respostaEsperada: item.respostaCorreta || item.resposta || item.definicao,
    habilidadeBncc: input.habilidadesBncc?.[index % Math.max(1, input.habilidadesBncc.length)]?.codigo || "",
    nivel: input.nivelDificuldade || "intermediario",
  }));
}

function buildWordSearchArtifact(items: Required<MaterialGameBlueprintItem>[], input: MaterialGeneratorRequest, title: string): GameArtifact {
  const count = normalizeGameItemCount("caca_palavras", input.quantidadeQuestoes, input.tamanho);
  const selected = items.slice(0, count);
  const words = selected.map((item) => item.termo || item.resposta).map(normalizeGameWord).filter(Boolean);
  const grid = buildWordSearchGrid(words, `${input.temaCentral}-${input.anoSerie}-wordsearch`);

  return {
    format: "caca_palavras",
    title,
    studentSections: [
      gridToTableHtml("Caça-palavras — versão do aluno", grid, true),
      `<h3>Palavras para encontrar</h3><ul>${words.map((word) => `<li>${escapeHtml(word)}</li>`).join("")}</ul>`,
      `<p><strong>Desafio pós-jogo:</strong> escolha três palavras encontradas e explique a relação delas com ${escapeHtml(input.temaCentral)}.</p>`,
    ],
    teacherSections: [
      gridToTableHtml("Gabarito do caça-palavras", grid, true),
      `<h3>Palavras e sentidos pedagógicos</h3><table><thead><tr><th>Palavra</th><th>Conceito</th></tr></thead><tbody>${selected.map((item) => `<tr><td>${escapeHtml(normalizeGameWord(item.termo))}</td><td>${escapeHtml(item.definicao)}</td></tr>`).join("")}</tbody></table>`,
    ],
    tables: [],
    questions: makeQuestionsFromItems(selected, input),
    answers: selected.map((item, index) => ({ questao: index + 1, resposta: `${normalizeGameWord(item.termo)} — ${item.definicao}` })),
  };
}

function buildCrosswordArtifact(items: Required<MaterialGameBlueprintItem>[], input: MaterialGeneratorRequest, title: string): GameArtifact {
  const count = normalizeGameItemCount("cruzadinha", input.quantidadeQuestoes, input.tamanho);
  const selected = items.slice(0, count);
  const crossword = buildCrossword(selected, `${input.temaCentral}-${input.anoSerie}-crossword`);
  const horizontal = crossword.placements.filter((item) => item.direction === "horizontal");
  const vertical = crossword.placements.filter((item) => item.direction === "vertical");

  const cluesHtml = [
    `<h3>Pistas horizontais</h3><ol>${horizontal.map((item) => `<li><strong>${item.number}.</strong> ${escapeHtml(item.clue)}</li>`).join("")}</ol>`,
    `<h3>Pistas verticais</h3><ol>${vertical.map((item) => `<li><strong>${item.number}.</strong> ${escapeHtml(item.clue)}</li>`).join("")}</ol>`,
  ].join("");

  return {
    format: "cruzadinha",
    title,
    studentSections: [
      gridToTableHtml("Cruzadinha — versão do aluno", crossword.grid, false),
      cluesHtml,
    ],
    teacherSections: [
      gridToTableHtml("Gabarito da cruzadinha", crossword.grid, true),
      `<h3>Respostas</h3><ol>${crossword.placements.map((item) => `<li><strong>${item.number}.</strong> ${escapeHtml(item.word)} — ${escapeHtml(item.clue)}</li>`).join("")}</ol>`,
    ],
    tables: [],
    questions: makeQuestionsFromItems(selected, input),
    answers: crossword.placements.map((item) => ({ questao: item.number, resposta: item.word })),
  };
}

function buildBingoArtifact(items: Required<MaterialGameBlueprintItem>[], input: MaterialGeneratorRequest, title: string): GameArtifact {
  const selected = items.slice(0, normalizeGameItemCount("bingo_pedagogico", input.quantidadeQuestoes, input.tamanho));
  const terms = selected.map((item) => item.termo || item.respostaCorreta).filter(Boolean);
  const cardSize = terms.length >= 25 ? 5 : 4;
  const cellsPerCard = cardSize * cardSize;
  const cardCount = input.tamanho === "completo" ? 8 : input.tamanho === "curto" ? 4 : 6;

  const cardHtml = Array.from({ length: cardCount }, (_, index) => {
    const cardTerms = shuffle(terms, `${input.temaCentral}-bingo-${index}`).slice(0, cellsPerCard);
    const rows = Array.from({ length: cardSize }, (__, row) => cardTerms.slice(row * cardSize, row * cardSize + cardSize));
    return `<h3>Cartela ${index + 1}</h3><table><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  }).join("");

  return {
    format: "bingo_pedagogico",
    title,
    studentSections: [cardHtml],
    teacherSections: [
      `<h3>Lista de sorteio do professor</h3><ol>${selected.map((item) => `<li><strong>${escapeHtml(item.termo)}:</strong> ${escapeHtml(item.definicao)}</li>`).join("")}</ol>`,
      `<p><strong>Como sortear:</strong> leia a definição, exemplo ou pergunta. Os estudantes marcam o conceito correspondente na cartela.</p>`,
    ],
    tables: [],
    questions: makeQuestionsFromItems(selected, input),
    answers: selected.map((item, index) => ({ questao: index + 1, resposta: `${item.termo}: ${item.definicao}` })),
  };
}

function buildCardGameArtifact(format: MaterialGameFormat, items: Required<MaterialGameBlueprintItem>[], input: MaterialGeneratorRequest, title: string): GameArtifact {
  const selected = items.slice(0, normalizeGameItemCount(format, input.quantidadeQuestoes, input.tamanho));
  const formatLabel = getMaterialGameFormatLabel(format);

  if (format === "jogo_memoria" || format === "jogo_associacao") {
    const cards = selected.flatMap((item, index) => ([
      [`Par ${index + 1}A`, item.termo, "Conceito/termo"],
      [`Par ${index + 1}B`, item.definicao, "Definição/exemplo"],
    ]));

    return {
      format,
      title,
      studentSections: [tableHtml({ title: `${formatLabel} — cartas para recortar`, headers: ["Carta", "Conteúdo", "Tipo"], rows: cards })],
      teacherSections: [tableHtml({ title: "Pares corretos", headers: ["Par", "Termo", "Definição"], rows: selected.map((item, index) => [String(index + 1), item.termo, item.definicao]) })],
      tables: [],
      questions: makeQuestionsFromItems(selected, input),
      answers: selected.map((item, index) => ({ questao: index + 1, resposta: `${item.termo} ↔ ${item.definicao}` })),
    };
  }

  if (format === "domino_pedagogico") {
    const pieces = selected.map((item, index) => {
      const next = selected[(index + 1) % selected.length];
      return [`Peça ${index + 1}`, item.definicao, next.termo];
    });

    return {
      format,
      title,
      studentSections: [tableHtml({ title: "Dominó pedagógico — peças para recortar", headers: ["Peça", "Lado esquerdo", "Lado direito"], rows: pieces })],
      teacherSections: [tableHtml({ title: "Sequência de conferência", headers: ["Ordem", "Conceito", "Definição"], rows: selected.map((item, index) => [String(index + 1), item.termo, item.definicao]) })],
      tables: [],
      questions: makeQuestionsFromItems(selected, input),
      answers: selected.map((item, index) => ({ questao: index + 1, resposta: `${item.termo}: ${item.definicao}` })),
    };
  }

  const rows = selected.map((item, index) => [
    String(index + 1),
    item.categoria,
    item.pergunta || item.desafio,
    item.respostaCorreta || item.resposta || item.definicao,
  ]);

  return {
    format,
    title,
    studentSections: [tableHtml({ title: `${formatLabel} — cartas/desafios`, headers: ["Nº", "Categoria", "Desafio", "Espaço da resposta"], rows: rows.map((row) => [row[0], row[1], row[2], ""]) })],
    teacherSections: [tableHtml({ title: `${formatLabel} — gabarito do professor`, headers: ["Nº", "Categoria", "Desafio", "Resposta esperada"], rows })],
    tables: [],
    questions: makeQuestionsFromItems(selected, input),
    answers: selected.map((item, index) => ({ questao: index + 1, resposta: item.respostaCorreta || item.resposta || item.definicao })),
  };
}

function buildTrailArtifact(items: Required<MaterialGameBlueprintItem>[], input: MaterialGeneratorRequest, title: string): GameArtifact {
  const selected = items.slice(0, normalizeGameItemCount("trilha_tabuleiro", input.quantidadeQuestoes, input.tamanho));
  const houses = selected.map((item, index) => [String(index + 1), item.categoria, item.desafio || item.pergunta, item.respostaCorreta || item.definicao]);

  return {
    format: "trilha_tabuleiro",
    title,
    studentSections: [
      tableHtml({ title: "Trilha/tabuleiro — casas do jogo", headers: ["Casa", "Categoria", "Desafio", "Resposta do grupo"], rows: houses.map((row) => [row[0], row[1], row[2], ""]) }),
      `<p><strong>Regra sugerida:</strong> avance uma casa ao responder corretamente. Em erro, permaneça na casa e receba mediação do professor.</p>`,
    ],
    teacherSections: [tableHtml({ title: "Gabarito dos desafios da trilha", headers: ["Casa", "Categoria", "Desafio", "Resposta esperada"], rows: houses })],
    tables: [],
    questions: makeQuestionsFromItems(selected, input),
    answers: selected.map((item, index) => ({ questao: index + 1, resposta: item.respostaCorreta || item.definicao })),
  };
}

function buildEscapeRoomArtifact(items: Required<MaterialGameBlueprintItem>[], input: MaterialGeneratorRequest, title: string): GameArtifact {
  const selected = items.slice(0, normalizeGameItemCount("escape_room_educativo", input.quantidadeQuestoes, input.tamanho));
  const missions = selected.map((item, index) => [
    `Enigma ${index + 1}`,
    item.desafio || item.pergunta,
    item.pista,
    item.respostaCorreta || item.resposta || item.termo,
  ]);

  return {
    format: "escape_room_educativo",
    title,
    studentSections: [
      `<h3>Missão</h3><p>A turma precisa resolver os enigmas para desbloquear a conclusão sobre ${escapeHtml(input.temaCentral)}.</p>`,
      tableHtml({ title: "Enigmas para os grupos", headers: ["Etapa", "Enigma", "Pista liberável", "Resposta do grupo"], rows: missions.map((row) => [row[0], row[1], row[2], ""]) }),
    ],
    teacherSections: [tableHtml({ title: "Solução do escape room", headers: ["Etapa", "Enigma", "Pista", "Solução"], rows: missions })],
    tables: [],
    questions: makeQuestionsFromItems(selected, input),
    answers: selected.map((item, index) => ({ questao: index + 1, resposta: item.respostaCorreta || item.resposta || item.termo })),
  };
}

function buildArtifact(format: MaterialGameFormat, items: Required<MaterialGameBlueprintItem>[], input: MaterialGeneratorRequest, title: string): GameArtifact {
  switch (format) {
    case "caca_palavras":
      return buildWordSearchArtifact(items, input, title);
    case "cruzadinha":
      return buildCrosswordArtifact(items, input, title);
    case "bingo_pedagogico":
      return buildBingoArtifact(items, input, title);
    case "trilha_tabuleiro":
      return buildTrailArtifact(items, input, title);
    case "escape_room_educativo":
      return buildEscapeRoomArtifact(items, input, title);
    case "jogo_memoria":
    case "domino_pedagogico":
    case "jogo_associacao":
    case "cartas_desafio":
    case "quiz_equipes":
    case "roleta_perguntas":
    case "verdadeiro_falso_grupos":
    case "dinamica_cooperativa":
    default:
      return buildCardGameArtifact(format, items, input, title);
  }
}

export function buildGameMaterialFromBlueprint(
  blueprint: MaterialGameBlueprint,
  input: MaterialGeneratorRequest,
  creditCost: number,
): PlanifyGeneratedMaterial {
  const formatRule = getMaterialGameFormatRule(input.jogoDinamica?.formato);
  const format = formatRule.value;
  const title = toText(blueprint.titulo, `${formatRule.label} — ${input.temaCentral}`);
  const subtitle = toText(blueprint.subtitulo, `${input.componenteCurricular} • ${input.anoSerie} • ${formatRule.label}`);
  const resumo = toText(blueprint.resumo || blueprint.contextualizacao, `${formatRule.label} pronto para aplicação sobre ${input.temaCentral}.`);
  const items = normalizeBlueprintItems(blueprint, input);
  const artifact = buildArtifact(format, items, input, title);

  const materiais = compactArray(blueprint.materiais);
  const preparacao = compactArray(blueprint.preparacao);
  const regras = compactArray(blueprint.regras);
  const comoJogar = compactArray(blueprint.comoJogar);
  const pontuacao = compactArray(blueprint.pontuacao);
  const fechamento = compactArray(blueprint.fechamento);
  const adaptacoes = compactArray(blueprint.adaptacoesInclusivas);
  const criterios = compactArray(blueprint.criteriosAvaliacao);

  const overviewRows = [
    ["Formato", formatRule.label],
    ["Organização", input.jogoDinamica?.organizacao || blueprint.organizacao || "Grupos"],
    ["Duração", input.jogoDinamica?.duracao || blueprint.tempoEstimado || "30 a 50 minutos"],
    ["Participantes", input.jogoDinamica?.participantes || "Turma inteira"],
    ["Movimento", input.jogoDinamica?.nivelMovimento || "baixo a moderado"],
  ];

  const dadosJogoHtml = tableHtml({
    title: "Ficha técnica do jogo",
    headers: ["Campo", "Descrição"],
    rows: overviewRows,
  });

  const studentHtml = artifact.studentSections.join("\n");
  const teacherHtml = artifact.teacherSections.join("\n");

  const html = sanitizeMaterialHtml(`
<article class="planify-material planify-game-material" style="font-family: Arial, sans-serif; color:#0f172a; line-height:1.6; max-width: 920px; margin: 0 auto;">
  <header style="margin: 0 0 30px; padding: 28px; border-radius: 24px; background: linear-gradient(135deg,#ecfeff,#ffffff,#ecfdf5); border: 1px solid #bae6fd;">
    <p style="margin:0 0 10px; color:#0891b2; font-size:12px; letter-spacing:.16em; text-transform:uppercase; font-weight:800;">Jogo pedagógico imprimível</p>
    <h1 style="margin:0; color:#0f172a; font-size:30px; line-height:1.12;">${escapeHtml(title)}</h1>
    <p style="margin:12px 0 0; color:#334155; font-weight:700;">${escapeHtml(subtitle)}</p>
    <p style="margin:16px 0 0; color:#475569; line-height:1.7;">${escapeHtml(resumo)}</p>
  </header>

  ${sectionHtml("1. Visão geral pedagógica", `
    <p style="${palette.text}"><strong>Objetivo:</strong> ${escapeHtml(blueprint.objetivoPedagogico || `Revisar e aplicar conhecimentos sobre ${input.temaCentral}.`)}</p>
    <p style="${palette.text}"><strong>Contextualização:</strong> ${escapeHtml(blueprint.contextualizacao || `Este jogo trabalha ${input.temaCentral} de forma ativa e adequada ao ${input.anoSerie}.`)}</p>
  `)}

  ${sectionHtml("2. Dados e preparação", dadosJogoHtml)}
  ${listHtml("3. Materiais necessários", materiais.length ? materiais : [input.jogoDinamica?.materiais || "Folhas impressas, quadro, canetas e material de registro."])}
  ${listHtml("4. Preparação do professor", preparacao.length ? preparacao : ["Imprimir ou projetar o material.", "Explicar o objetivo pedagógico e as regras antes de iniciar.", "Organizar a turma conforme o formato escolhido."])}
  ${listHtml("5. Como aplicar", comoJogar.length ? comoJogar : ["Apresente o desafio inicial.", "Distribua os materiais aos estudantes.", "Acompanhe as respostas e promova mediação durante o jogo.", "Finalize com correção comentada e síntese do conteúdo."])}
  ${listHtml("6. Regras", regras.length ? regras : ["Respeitar a vez de cada grupo ou estudante.", "Registrar as respostas antes da conferência.", "Justificar respostas quando solicitado.", "Vence quem demonstrar melhor compreensão, cooperação e participação."])}
  ${listHtml("7. Pontuação ou cooperação", pontuacao.length ? pontuacao : ["1 ponto por resposta correta.", "Bônus para justificativa bem explicada.", "Possibilidade de pontuação cooperativa para envolver toda a turma."])}

  <div class="page-break" style="height:1px; margin: 34px 0; border-top: 2px dashed #cbd5e1; page-break-after: always; break-after: page;"></div>

  <section style="margin: 32px 0; padding: 24px; border: 2px solid #0f172a; border-radius: 20px; background:#ffffff; page-break-inside: avoid; break-inside: avoid;">
    <p style="margin:0 0 8px; color:#475569; font-size:12px; letter-spacing:.14em; text-transform:uppercase; font-weight:800;">Versão do aluno</p>
    <h2 style="margin:0 0 18px; color:#0f172a; font-size:24px;">${escapeHtml(formatRule.label)} — folha de aplicação</h2>
    <table style="${palette.table}"><tbody>
      <tr><th style="${palette.th}">Nome</th><td style="${palette.td}"></td><th style="${palette.th}">Turma</th><td style="${palette.td}"></td></tr>
      <tr><th style="${palette.th}">Data</th><td style="${palette.td}"></td><th style="${palette.th}">Tema</th><td style="${palette.td}">${escapeHtml(input.temaCentral)}</td></tr>
    </tbody></table>
    <div style="margin-top: 24px;">${studentHtml}</div>
  </section>

  <div class="page-break" style="height:1px; margin: 34px 0; border-top: 2px dashed #cbd5e1; page-break-after: always; break-after: page;"></div>

  <section style="margin: 32px 0; padding: 24px; border: 2px solid #f59e0b; border-radius: 20px; background:#fffbeb; page-break-inside: avoid; break-inside: avoid;">
    <p style="margin:0 0 8px; color:#92400e; font-size:12px; letter-spacing:.14em; text-transform:uppercase; font-weight:800;">Versão do professor</p>
    <h2 style="margin:0 0 18px; color:#0f172a; font-size:24px;">Gabarito, mediação e respostas</h2>
    <div style="margin-top: 18px;">${teacherHtml}</div>
  </section>

  ${listHtml("Fechamento pedagógico", fechamento.length ? fechamento : [`Promova uma conversa final sobre o que foi aprendido em ${input.temaCentral}.`, "Peça aos estudantes que expliquem quais conceitos foram mais importantes."], "teacher")}
  ${listHtml("Adaptações inclusivas", adaptacoes.length ? adaptacoes : [input.inclusaoAcessibilidade || "Usar leitura clara, apoio visual e mediação para estudantes que precisem de mais tempo."])}
  ${listHtml("Critérios de avaliação", criterios.length ? criterios : ["Participação e cooperação.", "Compreensão dos conceitos.", "Justificativa das respostas.", "Registro adequado das descobertas."])}
</article>
  `.trim());

  const activities: MaterialGeneratedActivity[] = [
    {
      titulo: `${formatRule.label} — aplicação em sala`,
      instrucoes: `Aplique o jogo seguindo as regras e registre as respostas para correção comentada sobre ${input.temaCentral}.`,
      questoes: artifact.questions,
    },
  ];

  return {
    metadata: {
      titulo: title,
      tipoMaterial: "jogo",
      etapaEnsino: input.etapaEnsino,
      anoSerie: input.anoSerie,
      componenteCurricular: input.componenteCurricular,
      temaCentral: input.temaCentral,
      nivelDificuldade: input.nivelDificuldade,
      tempoEstimado: input.jogoDinamica?.duracao || blueprint.tempoEstimado || "30 a 50 minutos",
      creditCost,
      bncc: input.habilidadesBncc || [],
    },
    capa: {
      titulo: title,
      subtitulo: subtitle,
      descricao: resumo,
    },
    introducao: {
      texto: resumo,
    },
    objetivosAprendizagem: [blueprint.objetivoPedagogico || `Aplicar conhecimentos sobre ${input.temaCentral}.`],
    secoes: [
      {
        ordem: 1,
        titulo: "Visão geral do jogo",
        tipo: "jogo",
        conteudo: [
          { tipoBloco: "paragrafo", texto: resumo },
          { tipoBloco: "destaque", texto: `Formato: ${formatRule.label}. Entrega estruturada com versão do aluno e gabarito do professor.` },
        ],
      },
      {
        ordem: 2,
        titulo: "Como aplicar",
        tipo: "metodologia",
        conteudo: comoJogar.map((item) => ({ tipoBloco: "lista", texto: item })),
      },
      {
        ordem: 3,
        titulo: "Regras e mediação",
        tipo: "orientacao",
        conteudo: regras.map((item) => ({ tipoBloco: "lista", texto: item })),
      },
    ],
    atividades: activities,
    gabarito: artifact.answers,
    criteriosAvaliacao: criterios.length ? criterios : ["Participação.", "Cooperação.", "Compreensão conceitual.", "Registro e justificativa das respostas."],
    sugestoesUsoProfessor: [
      "Explique o objetivo pedagógico antes do início.",
      "Faça mediações curtas durante a aplicação.",
      "Finalize com correção comentada e síntese coletiva.",
    ],
    htmlEditor: html,
    titulo: title,
    subtitulo: subtitle,
    tipo: getMaterialTypeLabel("jogo"),
    resumo,
    dadosGerais: {
      escola: input.escola,
      professor: input.professor,
      turma: input.turma,
      etapa: input.etapaEnsino,
      anoSerie: input.anoSerie,
      areaConhecimento: input.areaConhecimento,
      componenteCurricular: input.componenteCurricular,
      tema: input.temaCentral,
      duracao: input.jogoDinamica?.duracao || blueprint.tempoEstimado,
    },
    objetivos: [blueprint.objetivoPedagogico || `Aplicar conhecimentos sobre ${input.temaCentral}.`],
    conteudos: [input.temaCentral, formatRule.label, "Jogo pedagógico estruturado"],
    orientacoesProfessor: [
      ...(preparacao.length ? preparacao : ["Preparar os materiais antes da aula."]),
      ...(comoJogar.length ? comoJogar : ["Acompanhar as respostas e conduzir o fechamento."]),
    ],
    orientacoesAluno: ["Leia as regras com atenção.", "Participe com respeito.", "Registre respostas quando solicitado.", "Justifique suas escolhas."],
    questoes: artifact.questions,
    sugestoesUso: fechamento.length ? fechamento : ["Usar como revisão, fixação ou fechamento de conteúdo."],
    alertas: [],
    jogo: {
      formato: format,
      formatoLabel: formatRule.label,
      printable: formatRule.printable,
      itemCount: items.length,
      deliverables: formatRule.teacherDeliverables,
    },
  };
}
