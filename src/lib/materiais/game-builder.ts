import type { MaterialAIInput, MaterialAIOutput, MaterialAISection } from "../../types/ai";

export type PremiumGameModel =
  | "caca_palavras"
  | "cruzadinha"
  | "bingo"
  | "memoria"
  | "domino"
  | "quiz"
  | "cartas";

type WordPlacement = {
  word: string;
  row: number;
  col: number;
  direction: string;
};

type WordSearch = {
  grid: string[][];
  placed: WordPlacement[];
};

const GAME_LABELS: Record<PremiumGameModel, string> = {
  caca_palavras: "Caça-palavras visual",
  cruzadinha: "Cruzadinha visual",
  bingo: "Bingo pedagógico",
  memoria: "Jogo da memória",
  domino: "Dominó pedagógico",
  quiz: "Quiz com gabarito",
  cartas: "Cartas recortáveis",
};

const DEFAULT_TERMS = [
  "Conceito",
  "Exemplo",
  "Leitura",
  "Cultura",
  "Contexto",
  "Vocabulário",
  "Síntese",
  "Aplicação",
  "Revisão",
  "Interpretação",
  "Produção",
  "Linguagem",
];

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeModel(value: unknown): PremiumGameModel {
  const model = String(value || "").trim().toLowerCase();

  if (
    model === "caca_palavras" ||
    model === "cruzadinha" ||
    model === "bingo" ||
    model === "memoria" ||
    model === "domino" ||
    model === "quiz" ||
    model === "cartas"
  ) {
    return model;
  }

  return "caca_palavras";
}

function splitItems(value: MaterialAIInput["conteudos"] | string | undefined): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeText(item)).filter(Boolean);
  }

  return String(value || "")
    .split(/\r?\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function uniqueItems(items: string[]): string[] {
  return Array.from(
    new Map(
      items
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => [item.toLocaleLowerCase("pt-BR"), item]),
    ).values(),
  );
}

function normalizeWord(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase();
}

function titleCase(value: string): string {
  const clean = value.trim();
  if (!clean) return clean;
  return clean.charAt(0).toLocaleUpperCase("pt-BR") + clean.slice(1);
}

function getTerms(input: MaterialAIInput, limit = 24): string[] {
  const conteudos = splitItems(input.conteudos);
  const tema = normalizeText(input.tema);
  const base = uniqueItems([tema, ...conteudos].filter(Boolean));
  const expanded = base.flatMap((item) => {
    const words = item
      .split(/\s+/)
      .map((word) => word.trim())
      .filter((word) => normalizeWord(word).length >= 4);

    return [item, ...words];
  });

  const terms = uniqueItems(expanded)
    .map((item) => item.replace(/\s+/g, " ").trim())
    .filter((item) => item.length >= 3)
    .slice(0, limit);

  return terms.length ? terms : DEFAULT_TERMS.slice(0, limit);
}

function getWords(input: MaterialAIInput, limit = 14): string[] {
  const words = getTerms(input, 32)
    .map(normalizeWord)
    .filter((word) => word.length >= 4 && word.length <= 14);

  const result = uniqueItems(words).slice(0, limit);
  return result.length >= 6 ? result : uniqueItems([...result, ...DEFAULT_TERMS.map(normalizeWord)]).slice(0, limit);
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function makeClue(term: string, input: MaterialAIInput, index: number): string {
  const tema = normalizeText(input.tema) || "conteúdo estudado";
  const componente = normalizeText(input.componenteCurricular) || "componente curricular";
  const templates = [
    `Conceito relacionado ao tema ${tema}: ${term}.`,
    `Elemento de ${componente} trabalhado na aula: ${term}.`,
    `Palavra-chave usada para revisar ${tema}: ${term}.`,
    `Item que deve ser explicado com exemplo pelos estudantes: ${term}.`,
  ];

  return templates[index % templates.length];
}

function wordSearch(input: MaterialAIInput): WordSearch {
  const words = getWords(input, 14);
  const size = words.some((word) => word.length > 11) ? 16 : 14;
  const grid = Array.from({ length: size }, () => Array.from({ length: size }, () => ""));
  const placed: WordPlacement[] = [];
  const directions = [
    { dr: 0, dc: 1, label: "horizontal" },
    { dr: 1, dc: 0, label: "vertical" },
    { dr: 1, dc: 1, label: "diagonal" },
    { dr: 1, dc: -1, label: "diagonal invertida" },
  ];

  function canPlace(word: string, row: number, col: number, dr: number, dc: number) {
    for (let index = 0; index < word.length; index++) {
      const r = row + dr * index;
      const c = col + dc * index;
      if (r < 0 || c < 0 || r >= size || c >= size) return false;
      if (grid[r][c] && grid[r][c] !== word[index]) return false;
    }
    return true;
  }

  function place(word: string, row: number, col: number, dr: number, dc: number, direction: string) {
    for (let index = 0; index < word.length; index++) {
      grid[row + dr * index][col + dc * index] = word[index];
    }
    placed.push({ word, row: row + 1, col: col + 1, direction });
  }

  words.forEach((word, wordIndex) => {
    for (let attempt = 0; attempt < size * size * 2; attempt++) {
      const direction = directions[(wordIndex + attempt) % directions.length];
      const row = (wordIndex * 3 + attempt * 2) % size;
      const col = (wordIndex * 5 + attempt * 3) % size;
      if (canPlace(word, row, col, direction.dr, direction.dc)) {
        place(word, row, col, direction.dr, direction.dc, direction.label);
        return;
      }
    }
  });

  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (!grid[row][col]) {
        grid[row][col] = letters[(row * 7 + col * 11 + size) % letters.length];
      }
    }
  }

  return { grid, placed };
}

function renderGridTable(grid: string[][], cellSize = 32): string {
  return `<table style="border-collapse:collapse;margin:14px 0;width:auto;">${grid
    .map(
      (row) =>
        `<tr>${row
          .map(
            (cell) =>
              `<td style="width:${cellSize}px;height:${cellSize}px;border:1px solid #111827;text-align:center;vertical-align:middle;font-weight:800;font-family:Arial, sans-serif;font-size:14px;">${escapeHtml(cell)}</td>`,
          )
          .join("")}</tr>`,
    )
    .join("")}</table>`;
}

function renderWordBank(words: string[]): string {
  return `<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:12px 0;">${words
    .map(
      (word) =>
        `<div style="border:1px solid #94a3b8;border-radius:8px;padding:8px;text-align:center;font-weight:700;">${escapeHtml(word)}</div>`,
    )
    .join("")}</div>`;
}

function renderPrintableCards(cards: Array<{ title: string; body: string; footer?: string }>, columns = 3): string {
  return `<div style="display:grid;grid-template-columns:repeat(${columns},minmax(0,1fr));gap:10px;margin:14px 0;">${cards
    .map(
      (card) => `<div style="min-height:118px;border:2px dashed #334155;border-radius:12px;padding:12px;background:#ffffff;break-inside:avoid;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:900;text-transform:uppercase;color:#0f766e;">${escapeHtml(card.title)}</p>
        <p style="margin:0;font-size:14px;font-weight:700;color:#111827;">${escapeHtml(card.body)}</p>
        ${card.footer ? `<p style="margin:10px 0 0;font-size:11px;color:#475569;">${escapeHtml(card.footer)}</p>` : ""}
      </div>`,
    )
    .join("")}</div>`;
}

function bingoCards(input: MaterialAIInput): string[][][] {
  const terms = getTerms(input, 32);
  const base = terms.length >= 16 ? terms : uniqueItems([...terms, ...DEFAULT_TERMS]);

  return Array.from({ length: 6 }).map((_, cardIndex) => {
    const cells = Array.from({ length: 16 }).map((__, cellIndex) => {
      return base[(cardIndex * 7 + cellIndex * 3) % base.length];
    });
    return chunk(cells, 4);
  });
}

function renderBingoCard(rows: string[][], index: number): string {
  return `<div style="break-inside:avoid;margin:14px 0;padding:12px;border:2px solid #0f172a;border-radius:12px;">
    <h3 style="margin:0 0 10px;text-align:center;font-size:18px;">Cartela ${index + 1}</h3>
    <table style="border-collapse:collapse;width:100%;table-layout:fixed;">
      <tr>${["B", "I", "N", "G"].map((letter) => `<th style="border:1px solid #111827;padding:8px;background:#e0f2fe;font-weight:900;">${letter}</th>`).join("")}</tr>
      ${rows
        .map(
          (row) => `<tr>${row
            .map((cell) => `<td style="height:68px;border:1px solid #111827;text-align:center;vertical-align:middle;font-size:12px;font-weight:700;padding:6px;">${escapeHtml(cell)}</td>`)
            .join("")}</tr>`,
        )
        .join("")}
    </table>
  </div>`;
}

function crosswordRows(input: MaterialAIInput): Array<{ number: number; answer: string; clue: string; cells: string[] }> {
  return getWords(input, 12).map((word, index) => ({
    number: index + 1,
    answer: word,
    clue: makeClue(word, input, index),
    cells: word.split(""),
  }));
}

function renderCrossword(rows: Array<{ number: number; answer: string; clue: string; cells: string[] }>): string {
  return `<div style="margin:14px 0;">${rows
    .map(
      (row) => `<div style="display:flex;align-items:center;gap:8px;margin:8px 0;break-inside:avoid;">
        <div style="width:28px;height:28px;border-radius:999px;background:#0f766e;color:white;text-align:center;line-height:28px;font-weight:900;">${row.number}</div>
        <div style="display:flex;">${row.cells
          .map(() => `<span style="display:inline-block;width:30px;height:30px;border:1px solid #111827;background:#fff;"></span>`)
          .join("")}</div>
      </div>`,
    )
    .join("")}</div>`;
}

function dataSection(title: string, content: string, items: string[] = []): MaterialAISection {
  return { titulo: title, conteudo: content, itens: items };
}

function commonOutput(input: MaterialAIInput, label: string, visualHtml: string, sections: MaterialAISection[], gabarito: string[]): MaterialAIOutput {
  const conteudos = splitItems(input.conteudos);
  const objetivos = splitItems(input.objetivos || "");
  const title = normalizeText(input.titulo) || `${label} — ${normalizeText(input.tema) || "Material pedagógico"}`;

  return {
    titulo: title,
    subtitulo: `${label} — ${normalizeText(input.componenteCurricular) || "Componente curricular"}`,
    tipo: "jogo",
    resumo: `Jogo pedagógico visual, imprimível e editável para trabalhar ${normalizeText(input.tema) || "o conteúdo informado"}.`,
    dadosGerais: {
      escola: normalizeText(input.escola),
      professor: normalizeText(input.professor),
      etapa: normalizeText(input.etapa),
      anoSerie: normalizeText(input.anoSerie),
      areaConhecimento: normalizeText(input.areaConhecimento),
      componenteCurricular: normalizeText(input.componenteCurricular),
      tema: normalizeText(input.tema),
      duracao: normalizeText(input.duracao),
    },
    objetivos: objetivos.length
      ? objetivos
      : [
          `Revisar ${normalizeText(input.tema) || "o conteúdo"} por meio de um jogo pedagógico visual e participativo.`,
          "Estimular associação, atenção, argumentação e registro das aprendizagens.",
        ],
    conteudos,
    orientacoesProfessor: [
      "Imprima a versão do aluno e mantenha o gabarito apenas com o professor.",
      "Explique as regras em até cinco minutos e faça uma rodada demonstrativa.",
      "Organize individualmente, em duplas ou grupos conforme o tempo disponível.",
      "Finalize com correção coletiva, retomada dos conceitos e registro de aprendizagem.",
    ],
    orientacoesAluno: [
      "Leia o comando do jogo com atenção antes de iniciar.",
      "Participe respeitando a vez dos colegas e registrando as respostas quando solicitado.",
      "Na correção, explique como chegou às respostas e anote os pontos que precisa revisar.",
    ],
    introducao: "Material visual gerado em formato editável para impressão, recorte, aplicação em sala e revisão no Editor Planify.",
    secoes: sections,
    questoes: [],
    jogo: {
      nome: title,
      tipoJogo: label,
      objetivo: `Aplicar ${normalizeText(input.tema) || "o conteúdo"} em uma dinâmica lúdica, imprimível e avaliável.`,
      materiais: ["Material impresso", "Lápis ou caneta", "Tesoura sem ponta quando houver recorte", "Gabarito do professor"],
      preparacao: [
        "Gerar ou revisar o material no Editor Planify.",
        "Imprimir cópias suficientes para estudantes, duplas ou grupos.",
        "Recortar cartas, peças ou fichas quando o modelo exigir.",
      ],
      regras: [
        "Seguir o comando específico do jogo.",
        "Registrar respostas quando solicitado.",
        "Justificar respostas em pelo menos uma rodada de socialização.",
        "Conferir o resultado com o gabarito ao final.",
      ],
      modoDeJogar: [
        "Distribua o material.",
        "Leia o objetivo e as regras.",
        "Defina o tempo da rodada.",
        "Acompanhe as estratégias dos estudantes.",
        "Conclua com correção coletiva e síntese.",
      ],
      variacoes: [
        "Aplicar como revisão individual.",
        "Aplicar em duplas com justificativa oral.",
        "Aplicar por equipes com pontuação.",
        "Usar como estação de aprendizagem.",
      ],
      fechamento: "Peça que os estudantes registrem uma síntese curta com três aprendizagens, uma dúvida e um exemplo do conteúdo.",
    },
    projeto: undefined,
    roteiro: undefined,
    criteriosAvaliacao: [
      "Participação e colaboração durante o jogo.",
      "Compreensão dos conceitos trabalhados.",
      "Justificativa das respostas.",
      "Registro final das aprendizagens.",
    ],
    gabarito,
    adaptacoesInclusivas: [
      "Ampliar fonte ou espaçamento antes de imprimir, se necessário.",
      "Permitir realização em dupla para estudantes que precisam de apoio.",
      "Ler comandos em voz alta para garantir compreensão.",
    ],
    sugestoesUso: [
      "Usar como revisão antes de avaliação.",
      "Usar como diagnóstico no início da aula.",
      "Abrir no Editor para editar palavras, pistas, cartelas ou cartas.",
    ],
    alertas: [],
    visualHtml,
    printHtml: visualHtml,
  };
}

export function buildVisualGameMaterial(input: MaterialAIInput): MaterialAIOutput {
  const model = normalizeModel(input.modeloJogo);
  const label = GAME_LABELS[model];
  const tema = normalizeText(input.tema) || "tema estudado";
  const terms = getTerms(input, 30);
  let visualHtml = "";
  let sections: MaterialAISection[] = [];
  let gabarito: string[] = [];

  if (model === "caca_palavras") {
    const game = wordSearch(input);
    const words = game.placed.map((item) => item.word);
    visualHtml = `
      <section style="font-family:Arial, sans-serif;color:#111827;">
        <h2>Caça-palavras — versão do aluno</h2>
        <p>Encontre as palavras relacionadas ao tema <strong>${escapeHtml(tema)}</strong>. Depois escolha três palavras e escreva uma frase explicando cada uma.</p>
        ${renderGridTable(game.grid)}
        <h3>Banco de palavras</h3>
        ${renderWordBank(words)}
        <h2>Gabarito do professor</h2>
        <table style="border-collapse:collapse;width:100%;"><tr><th style="border:1px solid #111827;padding:8px;">Palavra</th><th style="border:1px solid #111827;padding:8px;">Início</th><th style="border:1px solid #111827;padding:8px;">Direção</th></tr>${game.placed
          .map((item) => `<tr><td style="border:1px solid #111827;padding:8px;">${escapeHtml(item.word)}</td><td style="border:1px solid #111827;padding:8px;">linha ${item.row}, coluna ${item.col}</td><td style="border:1px solid #111827;padding:8px;">${escapeHtml(item.direction)}</td></tr>`)
          .join("")}</table>
      </section>`;
    sections = [
      dataSection("Grade visual do caça-palavras", "O Editor exibirá a grade em quadradinhos, o banco de palavras e o gabarito."),
      dataSection("Palavras do jogo", "Palavras que aparecem na grade:", words),
    ];
    gabarito = game.placed.map((item) => `${item.word}: linha ${item.row}, coluna ${item.col}, ${item.direction}.`);
  }

  if (model === "cruzadinha") {
    const rows = crosswordRows(input);
    visualHtml = `
      <section style="font-family:Arial, sans-serif;color:#111827;">
        <h2>Cruzadinha — versão do aluno</h2>
        <p>Leia as pistas e preencha os quadradinhos com as respostas corretas.</p>
        ${renderCrossword(rows)}
        <h3>Pistas</h3>
        <ol>${rows.map((row) => `<li>${escapeHtml(row.clue)} (${row.answer.length} letras)</li>`).join("")}</ol>
        <h2>Gabarito do professor</h2>
        <ol>${rows.map((row) => `<li>${escapeHtml(row.answer)}</li>`).join("")}</ol>
      </section>`;
    sections = [
      dataSection("Cruzadinha visual", "O Editor exibirá os quadradinhos de preenchimento, pistas numeradas e gabarito."),
      dataSection("Pistas da cruzadinha", "Pistas para os estudantes:", rows.map((row) => `${row.number}. ${row.clue}`)),
    ];
    gabarito = rows.map((row) => `${row.number}. ${row.answer}`);
  }

  if (model === "bingo") {
    const cards = bingoCards(input);
    const callList = terms.slice(0, 28);
    visualHtml = `
      <section style="font-family:Arial, sans-serif;color:#111827;">
        <h2>Bingo pedagógico — cartelas para imprimir</h2>
        <p>O professor sorteia os itens da lista de chamada. Os estudantes marcam o termo correspondente na cartela.</p>
        <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;">${cards.map(renderBingoCard).join("")}</div>
        <h2>Lista de chamada do professor</h2>
        ${renderWordBank(callList)}
      </section>`;
    sections = [
      dataSection("Cartelas visuais de bingo", "O Editor exibirá seis cartelas diferentes em tabela 4x4."),
      dataSection("Lista de chamada", "Itens para sorteio ou leitura pelo professor:", callList),
    ];
    gabarito = callList.map((term, index) => `${index + 1}. ${term}`);
  }

  if (model === "memoria") {
    const pairs = terms.slice(0, 12);
    const cards = pairs.flatMap((term, index) => [
      { title: `Par ${index + 1}A`, body: titleCase(term), footer: "Carta conceito" },
      { title: `Par ${index + 1}B`, body: makeClue(term, input, index), footer: "Carta pista" },
    ]);
    visualHtml = `
      <section style="font-family:Arial, sans-serif;color:#111827;">
        <h2>Jogo da memória — cartas recortáveis</h2>
        <p>Recorte as cartas. O par correto une a carta de conceito à carta de pista.</p>
        ${renderPrintableCards(cards, 4)}
        <h2>Gabarito do professor</h2>
        <ol>${pairs.map((term, index) => `<li>Par ${index + 1}: ${escapeHtml(titleCase(term))} ↔ ${escapeHtml(makeClue(term, input, index))}</li>`).join("")}</ol>
      </section>`;
    sections = [
      dataSection("Cartas visuais recortáveis", "O Editor exibirá cartas em grade, com bordas tracejadas para recorte."),
      dataSection("Pares corretos", "Relação conceito ↔ pista:", pairs.map((term, index) => `Par ${index + 1}: ${titleCase(term)} ↔ ${makeClue(term, input, index)}`)),
    ];
    gabarito = pairs.map((term, index) => `Par ${index + 1}: ${titleCase(term)} ↔ ${makeClue(term, input, index)}`);
  }

  if (model === "domino") {
    const pieces = terms.slice(0, 14);
    const cards = pieces.map((term, index) => {
      const next = pieces[(index + 1) % pieces.length] || pieces[0];
      return {
        title: `Peça ${index + 1}`,
        body: `${titleCase(term)}  |  ${makeClue(next, input, index)}`,
        footer: "Recorte na borda tracejada e encaixe pela associação correta.",
      };
    });
    visualHtml = `
      <section style="font-family:Arial, sans-serif;color:#111827;">
        <h2>Dominó pedagógico — peças recortáveis</h2>
        <p>Cada peça tem dois lados. Encaixe a resposta ao conceito ou pista correspondente.</p>
        ${renderPrintableCards(cards, 2)}
        <h2>Sequência sugerida do gabarito</h2>
        <ol>${pieces.map((term, index) => `<li>Peça ${index + 1}: ${escapeHtml(titleCase(term))}</li>`).join("")}</ol>
      </section>`;
    sections = [
      dataSection("Peças visuais do dominó", "O Editor exibirá peças retangulares recortáveis com dois lados."),
      dataSection("Sequência de conferência", "Sequência sugerida para correção:", pieces.map((term, index) => `Peça ${index + 1}: ${titleCase(term)}`)),
    ];
    gabarito = pieces.map((term, index) => `Peça ${index + 1}: ${titleCase(term)}.`);
  }

  if (model === "quiz") {
    const quizTerms = terms.slice(0, 12);
    const questions = quizTerms.map((term, index) => ({
      title: `Pergunta ${index + 1}`,
      body: `Explique ou aplique o conceito "${term}" em uma situação relacionada ao tema ${tema}.`,
      footer: "Valor sugerido: 1 ponto + 1 ponto pela justificativa.",
    }));
    visualHtml = `
      <section style="font-family:Arial, sans-serif;color:#111827;">
        <h2>Quiz pedagógico — cartões de pergunta</h2>
        <p>Use os cartões em equipes, duplas ou individualmente. A resposta precisa ter justificativa.</p>
        ${renderPrintableCards(questions, 2)}
        <h2>Folha de pontuação</h2>
        <table style="border-collapse:collapse;width:100%;"><tr><th style="border:1px solid #111827;padding:8px;">Equipe</th><th style="border:1px solid #111827;padding:8px;">Rodada 1</th><th style="border:1px solid #111827;padding:8px;">Rodada 2</th><th style="border:1px solid #111827;padding:8px;">Total</th></tr>${[1, 2, 3, 4].map((row) => `<tr><td style="border:1px solid #111827;padding:10px;">Equipe ${row}</td><td style="border:1px solid #111827;padding:10px;"></td><td style="border:1px solid #111827;padding:10px;"></td><td style="border:1px solid #111827;padding:10px;"></td></tr>`).join("")}</table>
      </section>`;
    sections = [
      dataSection("Cartões visuais do quiz", "O Editor exibirá cartões de perguntas prontos para imprimir e recortar."),
      dataSection("Perguntas", "Perguntas do quiz:", questions.map((question) => question.body)),
    ];
    gabarito = quizTerms.map((term, index) => `Pergunta ${index + 1}: resposta deve explicar ${term} com exemplo coerente ao tema ${tema}.`);
  }

  if (model === "cartas") {
    const source = terms.slice(0, 24);
    const cards = source.map((term, index) => ({
      title: `Carta ${index + 1}`,
      body: `${titleCase(term)} — explique, exemplifique ou relacione com ${tema}.`,
      footer: index % 4 === 0 ? "Carta desafio" : index % 4 === 1 ? "Carta exemplo" : index % 4 === 2 ? "Carta associação" : "Carta síntese",
    }));
    visualHtml = `
      <section style="font-family:Arial, sans-serif;color:#111827;">
        <h2>Baralho pedagógico — cartas recortáveis</h2>
        <p>Recorte as cartas e use como revisão, estações de aprendizagem, sorteio de desafios ou jogo em equipes.</p>
        ${renderPrintableCards(cards, 3)}
        <h2>Modo rápido de aplicação</h2>
        <ol><li>Cada grupo compra uma carta.</li><li>Responde com justificativa.</li><li>Outro grupo pode complementar.</li><li>O professor valida e pontua.</li></ol>
      </section>`;
    sections = [
      dataSection("Baralho visual recortável", "O Editor exibirá cartas em grade com bordas tracejadas."),
      dataSection("Cartas do baralho", "Itens gerados:", cards.map((card) => `${card.title}: ${card.body}`)),
    ];
    gabarito = source.slice(0, 16).map((term, index) => `Carta ${index + 1}: aceitar resposta coerente que relacione ${term} ao tema ${tema}.`);
  }

  return commonOutput(input, label, visualHtml.trim(), sections, gabarito);
}
