import type { MaterialAIInput, MaterialAIOutput, MaterialAISection } from "../../types/ai";

export type PremiumGameModel =
  | "caca_palavras"
  | "cruzadinha"
  | "bingo"
  | "memoria"
  | "domino"
  | "quiz"
  | "cartas"
  | "trilha";

type WordPlacement = {
  word: string;
  label: string;
  clue: string;
  row: number;
  col: number;
  direction: string;
};

type WordSearch = {
  grid: string[][];
  placed: WordPlacement[];
};

type GameSeedTerm = {
  label: string;
  answer: string;
  clue: string;
  category?: string;
};

type GameSeedPayload = {
  termos?: Array<{
    termo?: string;
    resposta?: string;
    palavra?: string;
    pista?: string;
    dica?: string;
    definicao?: string;
    categoria?: string;
  }>;
  perguntas?: Array<{
    pergunta?: string;
    resposta?: string;
    alternativas?: string[];
  }>;
};

type MaterialOutputWithSeed = Partial<MaterialAIOutput> & {
  jogoVisualSeed?: GameSeedPayload;
  termosDoJogo?: GameSeedPayload["termos"];
  bancoDePalavras?: GameSeedPayload["termos"];
};

type CrosswordDirection = "across" | "down";

type CrosswordPlacement = {
  number: number;
  answer: string;
  label: string;
  clue: string;
  row: number;
  col: number;
  direction: CrosswordDirection;
};

type CrosswordBoard = {
  grid: string[][];
  placements: CrosswordPlacement[];
};

type CrosswordPlacementCandidate = {
  seedIndex?: number;
  row: number;
  col: number;
  direction: CrosswordDirection;
  score: number;
  intersections: number;
  rareIntersectionScore: number;
};

type CrosswordPlacementCheck = {
  intersections: number;
  rareIntersectionScore: number;
  usedCellsAdded: number;
};

type CrosswordSearchState = {
  grid: string[][];
  placements: CrosswordPlacement[];
  remaining: GameSeedTerm[];
};

type CrosswordValidationResult = {
  valid: boolean;
  issues: string[];
};

const GAME_LABELS: Record<PremiumGameModel, string> = {
  caca_palavras: "Caça-palavras visual",
  cruzadinha: "Cruzadinha visual",
  bingo: "Bingo pedagógico",
  memoria: "Jogo da memória",
  domino: "Dominó pedagógico",
  quiz: "Quiz com gabarito",
  cartas: "Cartas recortáveis",
  trilha: "Trilha pedagógica",
};

const DEFAULT_SEEDS: GameSeedTerm[] = [
  { label: "Conceito", answer: "CONCEITO", clue: "Ideia principal estudada em uma aula ou atividade." },
  { label: "Exemplo", answer: "EXEMPLO", clue: "Situação usada para tornar uma explicação mais clara." },
  { label: "Leitura", answer: "LEITURA", clue: "Prática de compreender informações em um texto." },
  { label: "Cultura", answer: "CULTURA", clue: "Conjunto de valores, costumes, conhecimentos e formas de vida." },
  { label: "Contexto", answer: "CONTEXTO", clue: "Conjunto de circunstâncias que ajuda a interpretar uma informação." },
  { label: "Vocabulário", answer: "VOCABULARIO", clue: "Conjunto de palavras trabalhadas em determinado tema." },
  { label: "Síntese", answer: "SINTESE", clue: "Resumo organizado das ideias mais importantes." },
  { label: "Aplicação", answer: "APLICACAO", clue: "Uso prático de um conhecimento em uma situação." },
  { label: "Revisão", answer: "REVISAO", clue: "Retomada de conteúdos para fortalecer a aprendizagem." },
  { label: "Interpretação", answer: "INTERPRETACAO", clue: "Ato de compreender sentidos explícitos e implícitos." },
  { label: "Produção", answer: "PRODUCAO", clue: "Criação de texto, resposta, solução ou material autoral." },
  { label: "Linguagem", answer: "LINGUAGEM", clue: "Forma de comunicação por palavras, imagens, sons ou gestos." },
];

const GENERIC_SEED_ANSWERS = new Set(
  DEFAULT_SEEDS.map((seed) => seed.answer.toLocaleLowerCase("pt-BR")),
);

const INTERNAL_CROSSWORD_TEXT = [
  "qualidade obrigatoria",
  "priorize termos centrais",
  "garanta gabarito",
  "crie pistas",
  "nao revelem a resposta",
  "gerar uma cruzadinha",
];

const RAW_TERM_LABELS = [
  "palavra",
  "palavras",
  "palavras sugeridas",
  "palavras opcionais",
  "palavras sugeridas pelo professor",
  "termo",
  "termos",
  "termos da cruzadinha",
  "conteudo",
  "conteudos",
  "conteudo da cruzadinha",
  "tema",
  "observacoes",
  "observacao",
];

const COMMON_CROSSWORD_DISPLAY_ACCENTS: Record<string, string> = {
  ACAO: "Ação",
  ADAPTACAO: "Adaptação",
  ALUSAO: "Alusão",
  APRESENTACAO: "Apresentação",
  APLICACAO: "Aplicação",
  CELULA: "Célula",
  CITACAO: "Citação",
  COMUNICACAO: "Comunicação",
  CONCLUSAO: "Conclusão",
  CONDENSCACAO: "Condensação",
  CONDENSACAO: "Condensação",
  CONFIANCA: "Confiança",
  CONTEUDO: "Conteúdo",
  DIALOGO: "Diálogo",
  DIVERSAO: "Diversão",
  DIVISAO: "Divisão",
  DNA: "DNA",
  EPIGRAFE: "Epígrafe",
  ESPERANCA: "Esperança",
  ETICA: "Ética",
  EVAPORACAO: "Evaporação",
  GENERO: "Gênero",
  GENETICA: "Genética",
  GRAFICO: "Gráfico",
  GRAMATICA: "Gramática",
  INFERENCIA: "Inferência",
  INFILTRACAO: "Infiltração",
  INTERPRETACAO: "Interpretação",
  JO: "Jó",
  JUSTICA: "Justiça",
  LINGUISTICA: "Linguística",
  MEXICO: "México",
  METAFORA: "Metáfora",
  NUCLEO: "Núcleo",
  ORBITA: "Órbita",
  PACIENCIA: "Paciência",
  PARODIA: "Paródia",
  PRECIPITACAO: "Precipitação",
  PRODUCAO: "Produção",
  PROVACAO: "Provação",
  REFERENCIA: "Referência",
  RESTAURACAO: "Restauração",
  REVISAO: "Revisão",
  ROTACAO: "Rotação",
  SINTESE: "Síntese",
  TRADICAO: "Tradição",
  TRANSFORMACAO: "Transformação",
  TRANSLACAO: "Translação",
  VOCABULARIO: "Vocabulário",
};

const COMMON_PORTUGUESE_TEXT_ACCENTS: Record<string, string> = {
  acao: "ação",
  acoes: "ações",
  adaptacao: "adaptação",
  apos: "após",
  aplicacao: "aplicação",
  area: "área",
  basica: "básica",
  capitulo: "capítulo",
  capitulos: "capítulos",
  caracteristica: "característica",
  caracteristicas: "características",
  celula: "célula",
  celulas: "células",
  citacao: "citação",
  comunicacao: "comunicação",
  conclusao: "conclusão",
  conteudo: "conteúdo",
  conteudos: "conteúdos",
  critica: "crítica",
  dialogo: "diálogo",
  dificil: "difícil",
  dificeis: "difíceis",
  divisao: "divisão",
  epigrafe: "epígrafe",
  essencia: "essência",
  estetica: "estética",
  etica: "ética",
  experiencia: "experiência",
  experiencias: "experiências",
  explicacao: "explicação",
  explicita: "explícita",
  explicitas: "explícitas",
  explicito: "explícito",
  explicitos: "explícitos",
  fe: "fé",
  fenomeno: "fenômeno",
  fenomenos: "fenômenos",
  genero: "gênero",
  generos: "gêneros",
  genetica: "genética",
  grafico: "gráfico",
  graficos: "gráficos",
  gramatica: "gramática",
  humoristica: "humorística",
  inicio: "início",
  indicacao: "indicação",
  intencao: "intenção",
  interacao: "interação",
  interpretacao: "interpretação",
  ja: "já",
  linguistica: "linguística",
  numero: "número",
  nucleo: "núcleo",
  nucleos: "núcleos",
  oracao: "oração",
  oracoes: "orações",
  parodia: "paródia",
  pais: "país",
  paises: "países",
  pratica: "prática",
  praticas: "práticas",
  proposito: "propósito",
  publico: "público",
  recriacao: "recriação",
  referencia: "referência",
  referencias: "referências",
  relacao: "relação",
  revisao: "revisão",
  sequencia: "sequência",
  sintese: "síntese",
  situacao: "situação",
  situacoes: "situações",
  classificacao: "classificação",
  circunstancia: "circunstância",
  solucao: "solução",
  tambem: "também",
  transformacao: "transformação",
  unica: "única",
  unico: "único",
  versao: "versão",
  vocabulario: "vocabulário",
};

function hasPortugueseDiacritic(value: string): boolean {
  return /[\u00c0-\u017f]/.test(value);
}

function keepReplacementCase(match: string, replacement: string): string {
  if (match === match.toLocaleUpperCase("pt-BR")) {
    return replacement.toLocaleUpperCase("pt-BR");
  }
  const first = match.charAt(0);
  if (first && first === first.toLocaleUpperCase("pt-BR")) {
    return replacement.charAt(0).toLocaleUpperCase("pt-BR") + replacement.slice(1);
  }
  return replacement;
}

function restorePortugueseTextAccents(value: string): string {
  let output = normalizeText(value);
  if (!output) return output;

  for (const [plain, accented] of Object.entries(COMMON_PORTUGUESE_TEXT_ACCENTS)) {
    output = output.replace(new RegExp(`\\b${plain}\\b`, "gi"), (match) =>
      keepReplacementCase(match, accented),
    );
  }
  return output;
}

function displayCrosswordAnswer(placement: CrosswordPlacement): string {
  const label = normalizeText(placement.label);
  if (label && hasPortugueseDiacritic(label)) return label;

  const normalized = normalizeWord(label, 1) || placement.answer;
  return COMMON_CROSSWORD_DISPLAY_ACCENTS[normalized] || label || placement.answer;
}

function displayCrosswordClue(placement: CrosswordPlacement): string {
  return restorePortugueseTextAccents(placement.clue);
}

const KNOWLEDGE_PACKS: Array<{ keys: string[]; componentKeys?: string[]; terms: GameSeedTerm[] }> = [
  {
    keys: ["jo", "livro de jo", "personagem biblico", "sofrimento de jo", "historia de jo"],
    componentKeys: ["ensino religioso"],
    terms: [
      { label: "Jó", answer: "JO", clue: "Personagem bíblico lembrado por permanecer fiel durante grandes provações.", category: "personagem" },
      { label: "Paciência", answer: "PACIENCIA", clue: "Virtude associada à espera confiante diante das dificuldades.", category: "valor" },
      { label: "Fidelidade", answer: "FIDELIDADE", clue: "Atitude de manter compromisso e confiança mesmo em momentos difíceis.", category: "valor" },
      { label: "Sofrimento", answer: "SOFRIMENTO", clue: "Experiência dolorosa enfrentada pelo personagem central da narrativa.", category: "tema" },
      { label: "Esperança", answer: "ESPERANCA", clue: "Confiança de que a vida pode ser reconstruída após a dor.", category: "valor" },
      { label: "Provação", answer: "PROVACAO", clue: "Situação difícil que coloca a fé e a perseverança à prova.", category: "conceito" },
      { label: "Integridade", answer: "INTEGRIDADE", clue: "Qualidade de agir com retidão e coerência moral.", category: "valor" },
      { label: "Sabedoria", answer: "SABEDORIA", clue: "Capacidade de refletir profundamente sobre a vida, a fé e as escolhas.", category: "conceito" },
      { label: "Justiça", answer: "JUSTICA", clue: "Busca pelo que é correto, verdadeiro e digno nas relações humanas.", category: "valor" },
      { label: "Confiança", answer: "CONFIANCA", clue: "Postura de acreditar e permanecer firme mesmo sem respostas imediatas.", category: "valor" },
      { label: "Amigos", answer: "AMIGOS", clue: "Pessoas que dialogam com Jó durante sua experiência de sofrimento.", category: "personagens" },
      { label: "Restauração", answer: "RESTAURACAO", clue: "Momento de reconstrução e renovação apresentado ao final da narrativa.", category: "tema" },
    ],
  },
  {
    keys: ["ensino religioso", "religioso", "valores", "religiao", "fé", "fe"],
    componentKeys: ["ensino religioso"],
    terms: [
      { label: "Respeito", answer: "RESPEITO", clue: "Atitude de considerar a dignidade e a crença do outro." },
      { label: "Diálogo", answer: "DIALOGO", clue: "Conversa aberta para compreender ideias e experiências diferentes." },
      { label: "Empatia", answer: "EMPATIA", clue: "Capacidade de tentar compreender o sentimento e a situação do outro." },
      { label: "Tradição", answer: "TRADICAO", clue: "Conjunto de práticas e memórias transmitidas entre gerações." },
      { label: "Diversidade", answer: "DIVERSIDADE", clue: "Presença de diferentes modos de viver, crer e interpretar o mundo." },
      { label: "Ética", answer: "ETICA", clue: "Reflexão sobre atitudes, valores e responsabilidade nas escolhas." },
      { label: "Solidariedade", answer: "SOLIDARIEDADE", clue: "Ação de apoio e cuidado com quem precisa." },
      { label: "Comunidade", answer: "COMUNIDADE", clue: "Grupo de pessoas que compartilham vínculos, práticas e convivência." },
    ],
  },
  {
    keys: ["paises hispanicos", "mundo hispanico", "saudacoes", "espanhol", "lingua espanhola", "america latina"],
    componentKeys: ["lingua espanhola", "língua espanhola"],
    terms: [
      { label: "Saludos", answer: "SALUDOS", clue: "Expressões usadas para cumprimentar alguém em espanhol." },
      { label: "Hispânico", answer: "HISPANICO", clue: "Relacionado aos povos, países e culturas de língua espanhola." },
      { label: "Cultura", answer: "CULTURA", clue: "Costumes, valores e práticas de um povo ou grupo social." },
      { label: "Diversidade", answer: "DIVERSIDADE", clue: "Variedade de identidades, costumes e formas de expressão." },
      { label: "Vocabulário", answer: "VOCABULARIO", clue: "Conjunto de palavras usadas para comunicar uma ideia." },
      { label: "México", answer: "MEXICO", clue: "País hispânico localizado na América do Norte." },
      { label: "Argentina", answer: "ARGENTINA", clue: "País hispânico do Cone Sul conhecido pelo tango e pela região dos pampas." },
      { label: "Colômbia", answer: "COLOMBIA", clue: "País hispânico sul-americano banhado pelo Caribe e pelo Pacífico." },
      { label: "Pronúncia", answer: "PRONUNCIA", clue: "Modo como os sons de uma língua são articulados." },
      { label: "Apresentação", answer: "APRESENTACAO", clue: "Situação comunicativa em que alguém diz seu nome e informações pessoais." },
    ],
  },
  {
    keys: ["leitura", "interpretacao", "interpretação", "texto", "narrativo", "conto", "crônica", "cronica"],
    componentKeys: ["lingua portuguesa", "língua portuguesa"],
    terms: [
      { label: "Narrador", answer: "NARRADOR", clue: "Voz que conta os acontecimentos de uma narrativa." },
      { label: "Personagem", answer: "PERSONAGEM", clue: "Ser que participa das ações em uma história." },
      { label: "Enredo", answer: "ENREDO", clue: "Sequência dos acontecimentos principais de uma narrativa." },
      { label: "Conflito", answer: "CONFLITO", clue: "Problema ou tensão que movimenta a história." },
      { label: "Inferência", answer: "INFERENCIA", clue: "Conclusão construída a partir de pistas do texto." },
      { label: "Contexto", answer: "CONTEXTO", clue: "Informações que ajudam a compreender uma situação comunicativa." },
      { label: "Tema", answer: "TEMA", clue: "Assunto principal abordado em um texto." },
      { label: "Síntese", answer: "SINTESE", clue: "Resumo das ideias essenciais de um texto." },
    ],
  },
  {
    keys: ["matematica", "matemática", "fração", "fracao", "equacao", "equação", "porcentagem", "geometria"],
    componentKeys: ["matematica", "matemática"],
    terms: [
      { label: "Equação", answer: "EQUACAO", clue: "Sentença matemática que apresenta uma igualdade com valor desconhecido." },
      { label: "Fração", answer: "FRACAO", clue: "Representação de uma parte de um todo." },
      { label: "Porcentagem", answer: "PORCENTAGEM", clue: "Forma de representar uma razão em relação a cem." },
      { label: "Ângulo", answer: "ANGULO", clue: "Abertura formada por duas semirretas com mesma origem." },
      { label: "Perímetro", answer: "PERIMETRO", clue: "Medida do contorno de uma figura plana." },
      { label: "Área", answer: "AREA", clue: "Medida da superfície ocupada por uma figura." },
      { label: "Proporção", answer: "PROPORCAO", clue: "Relação de igualdade entre duas razões." },
      { label: "Gráfico", answer: "GRAFICO", clue: "Representação visual de dados ou relações numéricas." },
    ],
  },
  {
    keys: ["ciencias", "ciências", "ecossistema", "celula", "célula", "energia", "agua", "água", "sustentabilidade"],
    componentKeys: ["ciências", "biologia", "física", "química"],
    terms: [
      { label: "Ecossistema", answer: "ECOSSISTEMA", clue: "Conjunto formado pelos seres vivos e pelo ambiente em que interagem." },
      { label: "Célula", answer: "CELULA", clue: "Unidade básica estrutural e funcional dos seres vivos." },
      { label: "Energia", answer: "ENERGIA", clue: "Capacidade de realizar trabalho ou provocar transformações." },
      { label: "Matéria", answer: "MATERIA", clue: "Tudo aquilo que possui massa e ocupa espaço." },
      { label: "Água", answer: "AGUA", clue: "Substância essencial à vida, formada por hidrogênio e oxigênio." },
      { label: "Sustentabilidade", answer: "SUSTENTABILIDADE", clue: "Uso responsável dos recursos para preservar o presente e o futuro." },
      { label: "Experimento", answer: "EXPERIMENTO", clue: "Procedimento usado para investigar uma hipótese." },
      { label: "Hipótese", answer: "HIPOTESE", clue: "Explicação provisória que pode ser testada." },
    ],
  },
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

function normalizeForSearch(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const TEACHY_GAME_ALIASES: Record<string, PremiumGameModel> = {
  caca_palavras: "caca_palavras",
  "caca-palavras": "caca_palavras",
  "caça-palavras": "caca_palavras",
  "caca palavras": "caca_palavras",
  cruzadinha: "cruzadinha",
  "palavra cruzada": "cruzadinha",
  "palavra-cruzada": "cruzadinha",
  crossword: "cruzadinha",
  bingo: "bingo",
  memoria: "memoria",
  "jogo da memoria": "memoria",
  "jogo da memória": "memoria",
  "memory game": "memoria",
  domino: "domino",
  dominó: "domino",
  quiz: "quiz",
  cartas: "cartas",
  trilha: "trilha",
};

function normalizeModel(value: unknown): PremiumGameModel {
  const raw = String(value || "").trim().toLowerCase();
  const normalized = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (TEACHY_GAME_ALIASES[normalized]) {
    return TEACHY_GAME_ALIASES[normalized];
  }
  if (TEACHY_GAME_ALIASES[raw.replace(/\s+/g, "_")]) {
    return TEACHY_GAME_ALIASES[raw.replace(/\s+/g, "_")];
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

function uniqueByAnswer(items: GameSeedTerm[]): GameSeedTerm[] {
  return Array.from(
    new Map(
      items
        .filter((item) => item.answer && item.clue)
        .map((item) => [item.answer.toLocaleLowerCase("pt-BR"), item]),
    ).values(),
  );
}

function normalizeWord(value: string, minLength = 2): string {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();

  if (normalized.length < minLength) return "";
  return normalized;
}

function titleCase(value: string): string {
  const clean = value.trim();
  if (!clean) return clean;
  return clean.charAt(0).toLocaleUpperCase("pt-BR") + clean.slice(1).toLocaleLowerCase("pt-BR");
}

function removeAnswerFromClue(clue: string, answer: string, fallback: string): string {
  const cleaned = normalizeText(clue);
  if (!cleaned) return fallback;
  const answerSearch = normalizeForSearch(answer);
  const clueSearch = normalizeForSearch(cleaned);
  if (answerSearch && clueSearch.includes(answerSearch) && answerSearch.length > 3) return fallback;
  return cleaned;
}

function isRawTermLabel(value: string): boolean {
  const normalized = normalizeForSearch(value);
  return RAW_TERM_LABELS.some((label) => normalized === normalizeForSearch(label));
}

function clueForRawTerm(term: string, input: MaterialAIInput): string {
  const component = normalizeText(input.componenteCurricular) || "componente curricular";
  const theme = normalizeText(input.tema) || "tema estudado";
  const normalizedTerm = normalizeForSearch(term);

  if (["acao", "acoes", "verbonoinal", "predicativo", "predicado", "verbo", "nominal", "sujeito", "complemento", "transitivo", "intransitivo", "ligacao"].some((word) => normalizedTerm.includes(word))) {
    return `Elemento central da análise em ${component}, articulado ao tema "${theme}", que ajuda a compreender a função das palavras na frase.`;
  }

  return `Conceito central de ${component}, articulado ao tema "${theme}", cuja identificação ajuda a interpretar, organizar e aprofundar o conteúdo estudado.`;
}

function seedFromTermAndClue(
  term: string,
  clue: string | undefined,
  input: MaterialAIInput,
  category = "conteúdo informado",
): GameSeedTerm | null {
  const clean = term.replace(/\s+/g, " ").trim();
  if (!clean || isRawTermLabel(clean)) return null;

  const words = clean.split(/\s+/).filter(Boolean);
  const preferred = words.length > 3 ? words.find((word) => normalizeWord(word, 4)) || clean : clean;
  const answer = normalizeWord(preferred, 2);
  if (!answer || answer.length > 15 || isRawTermLabel(answer)) return null;
  const label = titleCase(preferred);
  const fallback = clueForRawTerm(label, input);

  return {
    label,
    answer,
    clue: removeAnswerFromClue(clue || "", answer, fallback),
    category,
  };
}

function seedFromRawTerm(term: string, input: MaterialAIInput): GameSeedTerm | null {
  const clean = term.replace(/\s+/g, " ").trim();
  if (!clean) return null;

  const [beforeSeparator, ...rest] = clean.split(/[:：–—-]/);
  const clue = rest.join("-").trim() || undefined;
  return seedFromTermAndClue(beforeSeparator || clean, clue, input);
}

function seedFromStructuredLine(line: string, input: MaterialAIInput): GameSeedTerm[] {
  const clean = line.replace(/^[\s•*-]+/, "").replace(/\s+/g, " ").trim();
  if (!clean) return [];

  const [beforeSeparator, ...rest] = clean.split(/[:：]/);
  if (rest.length > 0 && isRawTermLabel(beforeSeparator || "")) {
    return rest
      .join(":")
      .split(/,|;|\|/)
      .map((item) => seedFromTermAndClue(item, undefined, input, "termo indicado pelo professor"))
      .filter((item): item is GameSeedTerm => Boolean(item));
  }

  const structured = clean.match(/^(.{2,34}?)\s*[:：–—-]\s*(.{8,})$/);
  if (structured) {
    const seed = seedFromTermAndClue(
      structured[1],
      structured[2],
      input,
      "termo com pista informada",
    );
    return seed ? [seed] : [];
  }

  return clean
    .split(/,|\|/)
    .map((item) => seedFromTermAndClue(item, undefined, input, "termo indicado pelo professor"))
    .filter((item): item is GameSeedTerm => Boolean(item));
}

function seedsFromTextBlock(text: string, input: MaterialAIInput): GameSeedTerm[] {
  const raw = normalizeText(text);
  if (!raw) return [];

  return raw
    .split(/\r?\n|;/)
    .flatMap((line) => seedFromStructuredLine(line, input));
}

function isInternalCrosswordInstruction(value: string): boolean {
  const normalized = normalizeForSearch(value);
  return INTERNAL_CROSSWORD_TEXT.some((fragment) => normalized.includes(fragment));
}

function seedsFromTeacherSuggestions(text: unknown, input: MaterialAIInput): GameSeedTerm[] {
  const raw = normalizeText(text);
  if (!raw) return [];

  return raw
    .split(/\r?\n/)
    .filter((line) => {
      if (isInternalCrosswordInstruction(line)) return false;
      const [beforeSeparator] = line.replace(/^[\s•*-]+/, "").split(/[:：]/);
      return isRawTermLabel(beforeSeparator || "");
    })
    .flatMap((line) => seedFromStructuredLine(line, input));
}

function isViableCrosswordSeed(seed: GameSeedTerm): boolean {
  if (seed.answer.length < 3 || seed.answer.length > 13) return false;
  if (isInternalCrosswordInstruction(`${seed.label} ${seed.clue}`)) return false;
  if (normalizeForSearch(seed.clue).length < 18) return false;
  return true;
}

function extractAiSeeds(aiOutput?: MaterialOutputWithSeed): GameSeedTerm[] {
  const rawTerms = [
    ...(aiOutput?.jogoVisualSeed?.termos || []),
    ...(aiOutput?.termosDoJogo || []),
    ...(aiOutput?.bancoDePalavras || []),
  ];

  return rawTerms
    .map((item): GameSeedTerm | null => {
      const rawLabel = item.termo || item.palavra || item.resposta || "";
      const rawAnswer = item.resposta || item.palavra || item.termo || "";
      const answer = normalizeWord(rawAnswer, 2);
      if (!answer || answer.length > 15) return null;
      const label = normalizeText(rawLabel) || titleCase(answer);
      const fallback = clueForRawTerm(label, {
        tema: normalizeText(item.categoria) || normalizeText(label),
        componenteCurricular: normalizeText(item.categoria) || normalizeText(label),
      } as MaterialAIInput);
      return {
        label,
        answer,
        clue: removeAnswerFromClue(item.pista || item.dica || item.definicao || "", answer, fallback),
        category: item.categoria || "termo gerado pela IA",
      } satisfies GameSeedTerm;
    })
    .filter((item): item is GameSeedTerm => Boolean(item));
}

function knowledgeSeeds(
  input: MaterialAIInput,
  options: { allowComponentFallback?: boolean } = {},
): GameSeedTerm[] {
  const allowComponentFallback = options.allowComponentFallback !== false;
  const text = normalizeForSearch(`${input.tema || ""} ${splitItems(input.conteudos).join(" ")}`);
  const component = normalizeForSearch(input.componenteCurricular || "");
  const exactMatches: GameSeedTerm[] = [];
  const componentMatches: GameSeedTerm[] = [];

  for (const pack of KNOWLEDGE_PACKS) {
    const keyMatch = pack.keys.some((key) => {
      const normalizedKey = normalizeForSearch(key);
      return normalizedKey && (` ${text} `).includes(` ${normalizedKey} `);
    });
    const componentMatch = (pack.componentKeys || []).some((key) => component.includes(normalizeForSearch(key)));

    if (keyMatch) exactMatches.push(...pack.terms);
    else if (componentMatch) componentMatches.push(...pack.terms);
  }

  if (exactMatches.length) return exactMatches;
  return allowComponentFallback ? componentMatches : [];
}

function buildSeeds(input: MaterialAIInput, aiOutput?: MaterialOutputWithSeed, limit = 24): GameSeedTerm[] {
  const aiSeeds = extractAiSeeds(aiOutput);
  const packSeeds = knowledgeSeeds(input);
  const rawSeeds = [input.tema, input.observacoes, ...splitItems(input.conteudos)]
    .flatMap((item) => seedsFromTextBlock(String(item || ""), input));

  const primary = uniqueByAnswer([...aiSeeds, ...packSeeds, ...rawSeeds]);
  const withFallback = primary.length >= 8 ? primary : uniqueByAnswer([...primary, ...DEFAULT_SEEDS]);

  return withFallback.slice(0, limit);
}

function buildCrosswordSeeds(input: MaterialAIInput, aiOutput?: MaterialOutputWithSeed): GameSeedTerm[] {
  const aiSeeds = extractAiSeeds(aiOutput).filter(isViableCrosswordSeed);
  const exactPackSeeds = knowledgeSeeds(input, { allowComponentFallback: false });
  const teacherSeeds = seedsFromTeacherSuggestions(input.observacoes, input);
  const contentSeeds = splitItems(input.conteudos)
    .flatMap((item) => seedsFromTextBlock(String(item || ""), input))
    .filter(isViableCrosswordSeed);
  const explicitSeeds = uniqueByAnswer([...teacherSeeds, ...contentSeeds]);
  const themeSeeds = seedsFromTextBlock(String(input.tema || ""), input).filter(isViableCrosswordSeed);

  if (explicitSeeds.length > 0) {
    return uniqueByAnswer([...explicitSeeds, ...aiSeeds]);
  }

  const scopedSeeds = uniqueByAnswer([
    ...aiSeeds,
    ...exactPackSeeds,
    ...(aiSeeds.length ? [] : themeSeeds),
  ]);

  if (scopedSeeds.length > 0) {
    return scopedSeeds;
  }

  return DEFAULT_SEEDS;
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function getSeedWords(input: MaterialAIInput, aiOutput?: MaterialOutputWithSeed, limit = 14): GameSeedTerm[] {
  return buildSeeds(input, aiOutput, 32)
    .filter((seed) => seed.answer.length >= 2 && seed.answer.length <= 15)
    .slice(0, limit);
}

function scoreSeedForCrossword(seed: GameSeedTerm, allSeeds: GameSeedTerm[]): number {
  const length = seed.answer.length;
  const category = normalizeForSearch(seed.category || "");
  const clue = normalizeForSearch(seed.clue);
  const answer = seed.answer.toLocaleLowerCase("pt-BR");
  const sharedLetters = new Set(seed.answer.split("")).size
    ? seed.answer.split("").filter((letter) =>
        allSeeds.some((other) => other.answer !== seed.answer && other.answer.includes(letter)),
      ).length
    : 0;

  let score = 0;
  if (length >= 4 && length <= 10) score += 28;
  else if (length >= 3 && length <= 12) score += 16;
  else score -= 8;
  if (category.includes("professor") || category.includes("informad")) score += 26;
  if (category.includes("ia") || category.includes("gerado")) score += 16;
  if (!GENERIC_SEED_ANSWERS.has(answer)) score += 12;
  if (clue.length >= 35 && clue.length <= 180) score += 10;
  if (clue.includes("conceito trabalhado") || clue.includes("tema informado")) score -= 8;
  score += Math.min(24, sharedLetters * 3);
  return score;
}

function sortCrosswordSeeds(seeds: GameSeedTerm[]): GameSeedTerm[] {
  return [...seeds].sort((a, b) => {
    const scoreDiff = scoreSeedForCrossword(b, seeds) - scoreSeedForCrossword(a, seeds);
    if (scoreDiff) return scoreDiff;
    return b.answer.length - a.answer.length;
  });
}

function wordSearch(input: MaterialAIInput, aiOutput?: MaterialOutputWithSeed): WordSearch {
  const seeds = getSeedWords(input, aiOutput, 14);
  const size = seeds.some((seed) => seed.answer.length > 11) ? 16 : 14;
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

  function place(seed: GameSeedTerm, row: number, col: number, dr: number, dc: number, direction: string) {
    for (let index = 0; index < seed.answer.length; index++) {
      grid[row + dr * index][col + dc * index] = seed.answer[index];
    }
    placed.push({ word: seed.answer, label: seed.label, clue: seed.clue, row: row + 1, col: col + 1, direction });
  }

  seeds.forEach((seed, seedIndex) => {
    for (let attempt = 0; attempt < size * size * 3; attempt++) {
      const direction = directions[(seedIndex + attempt) % directions.length];
      const row = (seedIndex * 3 + attempt * 2) % size;
      const col = (seedIndex * 5 + attempt * 3) % size;
      if (canPlace(seed.answer, row, col, direction.dr, direction.dc)) {
        place(seed, row, col, direction.dr, direction.dc, direction.label);
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

function renderGridTable(grid: string[][]): string {
  return `<div class="planify-game-board"><table class="planify-game-table planify-game-table--wordsearch">${grid
    .map(
      (row) =>
        `<tr>${row
          .map(
            (cell) =>
              `<td class="planify-game-cell--letter">${escapeHtml(cell)}</td>`,
          )
          .join("")}</tr>`,
    )
    .join("")}</table></div>`;
}

function renderWordBank(words: string[]): string {
  return `<div class="planify-game-word-bank">${words
    .map(
      (word) =>
        `<div class="planify-game-word-bank-item">${escapeHtml(word)}</div>`,
    )
    .join("")}</div>`;
}

function renderPrintableCards(
  cards: Array<{ title: string; body: string; footer?: string }>,
): string {
  return `<div class="planify-game-cards-grid">${cards
    .map(
      (card) => `<div class="planify-game-card">
        <p class="planify-game-card-title">${escapeHtml(card.title)}</p>
        <p class="planify-game-card-body">${escapeHtml(card.body)}</p>
        ${card.footer ? `<p class="planify-game-card-footer">${escapeHtml(card.footer)}</p>` : ""}
      </div>`,
    )
    .join("")}</div>`;
}

function bingoCards(input: MaterialAIInput, aiOutput?: MaterialOutputWithSeed): string[][][] {
  const terms = buildSeeds(input, aiOutput, 32).map((seed) => seed.label);
  const base = terms.length >= 16 ? terms : [...terms, ...DEFAULT_SEEDS.map((seed) => seed.label)];

  return Array.from({ length: 6 }).map((_, cardIndex) => {
    const cells = Array.from({ length: 16 }).map((__, cellIndex) => {
      return base[(cardIndex * 7 + cellIndex * 3) % base.length];
    });
    return chunk(cells, 4);
  });
}

function renderBingoCard(rows: string[][], index: number): string {
  return `<div class="planify-game-bingo-card">
    <h3 style="margin:0 0 10px;text-align:center;font-size:18px;">Cartela ${index + 1}</h3>
    <table class="planify-game-table planify-game-table--bingo">
      <tr>${["B", "I", "N", "G"].map((letter) => `<th>${letter}</th>`).join("")}</tr>
      ${rows
        .map(
          (row) => `<tr>${row
            .map((cell) => `<td>${escapeHtml(cell)}</td>`)
            .join("")}</tr>`,
        )
        .join("")}
    </table>
  </div>`;
}

const CROSSWORD_DIRECTIONS: CrosswordDirection[] = ["across", "down"];

const CROSSWORD_RARE_LETTER_WEIGHT: Record<string, number> = {
  K: 9,
  W: 9,
  Y: 9,
  Z: 8,
  X: 7,
  J: 7,
  Q: 6,
  H: 5,
  F: 4,
  V: 4,
  G: 3.5,
  B: 3.2,
  P: 2.8,
  C: 2.4,
  D: 2.2,
  M: 2,
  N: 1.8,
  L: 1.7,
  R: 1.5,
  S: 1.4,
  T: 1.4,
  U: 1.2,
  I: 1.1,
  O: 1,
  A: 1,
  E: 1,
};

function letterRarity(letter: string): number {
  return CROSSWORD_RARE_LETTER_WEIGHT[letter] || 1;
}

function crosswordDirectionDelta(direction: CrosswordDirection) {
  return {
    dr: direction === "down" ? 1 : 0,
    dc: direction === "across" ? 1 : 0,
  };
}

function makeCrosswordGrid(size: number): string[][] {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => ""));
}

function cloneCrosswordGrid(grid: string[][]): string[][] {
  return grid.map((row) => [...row]);
}

function buildCrosswordOccupancy(placements: CrosswordPlacement[]): Map<string, CrosswordDirection[]> {
  const occupancy = new Map<string, CrosswordDirection[]>();
  for (const placement of placements) {
    const { dr, dc } = crosswordDirectionDelta(placement.direction);
    for (let index = 0; index < placement.answer.length; index++) {
      const key = `${placement.row + dr * index}:${placement.col + dc * index}`;
      const directions = occupancy.get(key) || [];
      if (!directions.includes(placement.direction)) directions.push(placement.direction);
      occupancy.set(key, directions);
    }
  }
  return occupancy;
}

function occupiedCrosswordCells(grid: string[][]): Array<{ row: number; col: number; letter: string }> {
  const cells: Array<{ row: number; col: number; letter: string }> = [];
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      const letter = grid[row][col];
      if (letter) cells.push({ row, col, letter });
    }
  }
  return cells;
}

function crosswordUsedCellCount(grid: string[][]): number {
  let count = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell) count += 1;
    }
  }
  return count;
}

function canPlaceCrossword(
  grid: string[][],
  answer: string,
  row: number,
  col: number,
  direction: CrosswordDirection,
  occupancy = buildCrosswordOccupancy([]),
): CrosswordPlacementCheck | false {
  const size = grid.length;
  const { dr, dc } = crosswordDirectionDelta(direction);
  const beforeRow = row - dr;
  const beforeCol = col - dc;
  const afterRow = row + dr * answer.length;
  const afterCol = col + dc * answer.length;

  if (
    row < 0 ||
    col < 0 ||
    row + dr * (answer.length - 1) >= size ||
    col + dc * (answer.length - 1) >= size
  ) {
    return false;
  }
  if (grid[beforeRow]?.[beforeCol]) return false;
  if (grid[afterRow]?.[afterCol]) return false;

  let intersections = 0;
  let rareIntersectionScore = 0;
  let usedCellsAdded = 0;

  for (let index = 0; index < answer.length; index++) {
    const r = row + dr * index;
    const c = col + dc * index;
    const current = grid[r][c];
    const letter = answer[index];
    if (current && current !== letter) return false;

    const occupiedDirections = occupancy.get(`${r}:${c}`) || [];
    if (current) {
      if (occupiedDirections.includes(direction)) return false;
      if (occupiedDirections.length === 0) return false;
      intersections += 1;
      rareIntersectionScore += letterRarity(letter);
      continue;
    }

    usedCellsAdded += 1;
    if (direction === "across" && (grid[r - 1]?.[c] || grid[r + 1]?.[c])) return false;
    if (direction === "down" && (grid[r]?.[c - 1] || grid[r]?.[c + 1])) return false;
  }

  return { intersections, rareIntersectionScore, usedCellsAdded };
}

function placeCrossword(grid: string[][], answer: string, row: number, col: number, direction: CrosswordDirection) {
  const dr = direction === "down" ? 1 : 0;
  const dc = direction === "across" ? 1 : 0;
  for (let index = 0; index < answer.length; index++) {
    grid[row + dr * index][col + dc * index] = answer[index];
  }
}

function candidateBounds(
  current: ReturnType<typeof crosswordBounds>,
  answer: string,
  row: number,
  col: number,
  direction: CrosswordDirection,
  size: number,
) {
  const { dr, dc } = crosswordDirectionDelta(direction);
  return {
    minRow: Math.max(0, Math.min(current.minRow, row)),
    maxRow: Math.min(size - 1, Math.max(current.maxRow, row + dr * (answer.length - 1))),
    minCol: Math.max(0, Math.min(current.minCol, col)),
    maxCol: Math.min(size - 1, Math.max(current.maxCol, col + dc * (answer.length - 1))),
  };
}

function scoreCrosswordCandidate(
  state: CrosswordSearchState,
  seed: GameSeedTerm,
  candidate: Omit<CrosswordPlacementCandidate, "score" | "rareIntersectionScore"> & {
    rareIntersectionScore: number;
    usedCellsAdded: number;
  },
  allSeeds: GameSeedTerm[],
  jitter: number,
): number {
  const size = state.grid.length;
  const currentBounds = crosswordBounds({ grid: state.grid, placements: state.placements });
  const nextBounds = candidateBounds(currentBounds, seed.answer, candidate.row, candidate.col, candidate.direction, size);
  const width = nextBounds.maxCol - nextBounds.minCol + 1;
  const height = nextBounds.maxRow - nextBounds.minRow + 1;
  const area = width * height;
  const centerRow = candidate.row + (candidate.direction === "down" ? (seed.answer.length - 1) / 2 : 0);
  const centerCol = candidate.col + (candidate.direction === "across" ? (seed.answer.length - 1) / 2 : 0);
  const centerPenalty = Math.abs(centerRow - size / 2) + Math.abs(centerCol - size / 2);
  const acrossCount = state.placements.filter((placement) => placement.direction === "across").length;
  const downCount = state.placements.length - acrossCount;
  const nextAcross = acrossCount + (candidate.direction === "across" ? 1 : 0);
  const nextDown = downCount + (candidate.direction === "down" ? 1 : 0);
  const squarePenalty = Math.abs(width - height);
  const densityGain = candidate.usedCellsAdded / area;
  const directionSwitchBonus =
    state.placements.length > 0 && state.placements[state.placements.length - 1]?.direction !== candidate.direction
      ? 18
      : 0;

  return (
    candidate.intersections * 520 +
    candidate.rareIntersectionScore * 44 +
    scoreSeedForCrossword(seed, allSeeds) * 3 +
    densityGain * 700 +
    directionSwitchBonus +
    Math.min(40, seed.answer.length * 3) -
    area * 4.2 -
    squarePenalty * 26 -
    Math.abs(nextAcross - nextDown) * 18 -
    centerPenalty * 5 +
    jitter
  );
}

function findCrosswordPlacementCandidates(
  state: CrosswordSearchState,
  seed: GameSeedTerm,
  allSeeds: GameSeedTerm[],
  limit: number,
  jitter: (value: string) => number,
): CrosswordPlacementCandidate[] {
  const occupancy = buildCrosswordOccupancy(state.placements);
  const occupied = occupiedCrosswordCells(state.grid);
  const candidates = new Map<string, CrosswordPlacementCandidate>();

  for (let wordIndex = 0; wordIndex < seed.answer.length; wordIndex++) {
    const letter = seed.answer[wordIndex];
    for (const cell of occupied) {
      if (cell.letter !== letter) continue;
      for (const direction of CROSSWORD_DIRECTIONS) {
        const candidateRow = direction === "down" ? cell.row - wordIndex : cell.row;
        const candidateCol = direction === "across" ? cell.col - wordIndex : cell.col;
        const result = canPlaceCrossword(
          state.grid,
          seed.answer,
          candidateRow,
          candidateCol,
          direction,
          occupancy,
        );
        if (!result || result.intersections === 0) continue;

        const key = `${candidateRow}:${candidateCol}:${direction}`;
        const score = scoreCrosswordCandidate(
          state,
          seed,
          {
            row: candidateRow,
            col: candidateCol,
            direction,
            intersections: result.intersections,
            rareIntersectionScore: result.rareIntersectionScore,
            usedCellsAdded: result.usedCellsAdded,
          },
          allSeeds,
          jitter(`${seed.answer}:${key}`),
        );
        const previous = candidates.get(key);
        if (!previous || score > previous.score) {
          candidates.set(key, {
            row: candidateRow,
            col: candidateCol,
            direction,
            score,
            intersections: result.intersections,
            rareIntersectionScore: result.rareIntersectionScore,
          });
        }
      }
    }
  }

  return [...candidates.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function renumberCrosswordPlacements(placements: CrosswordPlacement[]): CrosswordPlacement[] {
  const sorted = [...placements].sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row;
    if (a.col !== b.col) return a.col - b.col;
    return a.direction === "across" ? -1 : 1;
  });

  const result: CrosswordPlacement[] = [];
  let currentNumber = 0;
  let lastKey: string | null = null;
  for (const placement of sorted) {
    const key = `${placement.row}:${placement.col}`;
    if (key !== lastKey) {
      currentNumber += 1;
      lastKey = key;
    }
    result.push({ ...placement, number: currentNumber });
  }
  return result;
}

function countCrosswordIntersections(board: CrosswordBoard): number {
  const counts = new Map<string, number>();
  for (const placement of board.placements) {
    const dr = placement.direction === "down" ? 1 : 0;
    const dc = placement.direction === "across" ? 1 : 0;
    for (let index = 0; index < placement.answer.length; index++) {
      const key = `${placement.row + dr * index}:${placement.col + dc * index}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }
  return Array.from(counts.values()).filter((count) => count > 1).length;
}

function countRareCrosswordIntersections(board: CrosswordBoard): number {
  const cells = new Map<string, { letter: string; count: number }>();
  for (const placement of board.placements) {
    const { dr, dc } = crosswordDirectionDelta(placement.direction);
    for (let index = 0; index < placement.answer.length; index++) {
      const row = placement.row + dr * index;
      const col = placement.col + dc * index;
      const key = `${row}:${col}`;
      const current = cells.get(key) || { letter: placement.answer[index], count: 0 };
      current.count += 1;
      cells.set(key, current);
    }
  }
  return Array.from(cells.values()).reduce(
    (total, cell) => total + (cell.count > 1 ? letterRarity(cell.letter) : 0),
    0,
  );
}

function crosswordConnectivity(board: CrosswordBoard) {
  const graph = new Map<number, Set<number>>();
  const cells = new Map<string, number[]>();
  for (let index = 0; index < board.placements.length; index++) {
    graph.set(index, new Set());
    const placement = board.placements[index];
    const { dr, dc } = crosswordDirectionDelta(placement.direction);
    for (let letterIndex = 0; letterIndex < placement.answer.length; letterIndex++) {
      const key = `${placement.row + dr * letterIndex}:${placement.col + dc * letterIndex}`;
      const owners = cells.get(key) || [];
      for (const owner of owners) {
        graph.get(index)?.add(owner);
        graph.get(owner)?.add(index);
      }
      owners.push(index);
      cells.set(key, owners);
    }
  }

  if (board.placements.length === 0) {
    return { connected: false, isolatedCount: 0, componentCount: 0 };
  }

  const visited = new Set<number>();
  let componentCount = 0;
  for (let index = 0; index < board.placements.length; index++) {
    if (visited.has(index)) continue;
    componentCount += 1;
    const stack = [index];
    visited.add(index);
    while (stack.length) {
      const current = stack.pop();
      if (current === undefined) continue;
      for (const next of graph.get(current) || []) {
        if (visited.has(next)) continue;
        visited.add(next);
        stack.push(next);
      }
    }
  }

  const isolatedCount =
    board.placements.length <= 1
      ? 0
      : Array.from(graph.values()).filter((edges) => edges.size === 0).length;

  return {
    connected: componentCount === 1,
    isolatedCount,
    componentCount,
  };
}

function scoreCrosswordBoard(board: CrosswordBoard, targetCount: number): number {
  const placed = board.placements.length;
  if (placed === 0) return Number.NEGATIVE_INFINITY;

  const intersections = countCrosswordIntersections(board);
  const rareIntersections = countRareCrosswordIntersections(board);
  const across = board.placements.filter((placement) => placement.direction === "across").length;
  const down = board.placements.length - across;
  const bounds = crosswordBounds(board);
  const width = bounds.maxCol - bounds.minCol + 1;
  const height = bounds.maxRow - bounds.minRow + 1;
  const area = width * height;
  const usedCells = crosswordUsedCellCount(board.grid);
  const emptyCells = Math.max(0, area - usedCells);
  const density = usedCells / Math.max(1, area);
  const centerRow = (bounds.minRow + bounds.maxRow) / 2;
  const centerCol = (bounds.minCol + bounds.maxCol) / 2;
  const centerPenalty = Math.abs(centerRow - board.grid.length / 2) + Math.abs(centerCol - board.grid.length / 2);
  const shapePenalty = Math.abs(width - height);
  const longSidePenalty = Math.max(width, height);
  const connectivity = crosswordConnectivity(board);
  const crossedWords = new Set<number>();
  const cellOwners = new Map<string, number[]>();

  board.placements.forEach((placement, placementIndex) => {
    const { dr, dc } = crosswordDirectionDelta(placement.direction);
    for (let index = 0; index < placement.answer.length; index++) {
      const key = `${placement.row + dr * index}:${placement.col + dc * index}`;
      const owners = cellOwners.get(key) || [];
      owners.push(placementIndex);
      cellOwners.set(key, owners);
    }
  });
  for (const owners of cellOwners.values()) {
    if (owners.length > 1) owners.forEach((owner) => crossedWords.add(owner));
  }
  const wordsWithoutCrossing = placed > 1 ? placed - crossedWords.size : 0;

  return (
    placed * 2600 +
    (placed >= targetCount ? 900 : 0) -
    Math.max(0, targetCount - placed) * 3100 +
    intersections * 360 +
    rareIntersections * 34 -
    emptyCells * 16 -
    area * 5 -
    longSidePenalty * 28 -
    shapePenalty * 75 +
    (shapePenalty <= 2 ? 420 : 0) +
    density * 900 -
    centerPenalty * 18 -
    Math.abs(across - down) * 42 +
    (connectivity.connected ? 1600 : -5000 * Math.max(1, connectivity.componentCount)) -
    connectivity.isolatedCount * 2600 -
    wordsWithoutCrossing * 1400
  );
}

function validateCrosswordBoard(board: CrosswordBoard): CrosswordValidationResult {
  const issues: string[] = [];
  const seenAnswers = new Set<string>();
  const seenNumbers = new Set<number>();
  const claimedCells = new Map<
    string,
    Array<{ placementIndex: number; direction: CrosswordDirection; letter: string }>
  >();

  for (let placementIndex = 0; placementIndex < board.placements.length; placementIndex++) {
    const placement = board.placements[placementIndex];
    if (!placement.answer || !placement.clue || !placement.number) {
      issues.push(`Pista ou numeraÃ§Ã£o ausente em ${placement.answer || "termo sem resposta"}.`);
    }
    if (seenAnswers.has(placement.answer)) {
      issues.push(`Palavra repetida: ${placement.answer}.`);
    }
    seenAnswers.add(placement.answer);
    if (seenNumbers.has(placement.number)) {
      issues.push(`NumeraÃ§Ã£o repetida na pista ${placement.number}.`);
    }
    seenNumbers.add(placement.number);

    const { dr, dc } = crosswordDirectionDelta(placement.direction);
    const beforeRow = placement.row - dr;
    const beforeCol = placement.col - dc;
    const afterRow = placement.row + dr * placement.answer.length;
    const afterCol = placement.col + dc * placement.answer.length;
    if (board.grid[beforeRow]?.[beforeCol]) {
      issues.push(`Palavra encostada antes do inÃ­cio: ${placement.answer}.`);
    }
    if (board.grid[afterRow]?.[afterCol]) {
      issues.push(`Palavra encostada apÃ³s o fim: ${placement.answer}.`);
    }

    for (let index = 0; index < placement.answer.length; index++) {
      const row = placement.row + dr * index;
      const col = placement.col + dc * index;
      const expected = placement.answer[index];
      if (row < 0 || col < 0 || row >= board.grid.length || col >= board.grid.length) {
        issues.push(`Letra fora da grade em ${placement.answer}.`);
        continue;
      }
      if (board.grid[row][col] !== expected) {
        issues.push(`Letra fora do lugar em ${placement.answer}.`);
      }
      const key = `${row}:${col}`;
      const owners = claimedCells.get(key) || [];
      owners.push({ placementIndex, direction: placement.direction, letter: expected });
      claimedCells.set(key, owners);
    }
  }

  for (let row = 0; row < board.grid.length; row++) {
    for (let col = 0; col < board.grid[row].length; col++) {
      if (board.grid[row][col] && !claimedCells.has(`${row}:${col}`)) {
        issues.push(`Letra sem palavra na linha ${row + 1}, coluna ${col + 1}.`);
      }
    }
  }

  for (const [key, owners] of claimedCells) {
    const [rowText, colText] = key.split(":");
    const row = Number(rowText);
    const col = Number(colText);
    if (owners.length > 2) {
      issues.push(`Cruzamento triplo invÃ¡lido na linha ${row + 1}, coluna ${col + 1}.`);
    }
    if (owners.length === 2) {
      if (owners[0].letter !== owners[1].letter || owners[0].direction === owners[1].direction) {
        issues.push(`SobreposiÃ§Ã£o invÃ¡lida na linha ${row + 1}, coluna ${col + 1}.`);
      }
      continue;
    }

    const owner = owners[0];
    if (owner.direction === "across" && (board.grid[row - 1]?.[col] || board.grid[row + 1]?.[col])) {
      issues.push(`Contato vertical sem cruzamento na linha ${row + 1}, coluna ${col + 1}.`);
    }
    if (owner.direction === "down" && (board.grid[row]?.[col - 1] || board.grid[row]?.[col + 1])) {
      issues.push(`Contato horizontal sem cruzamento na linha ${row + 1}, coluna ${col + 1}.`);
    }
  }

  const connectivity = crosswordConnectivity(board);
  if (!connectivity.connected) {
    issues.push("A cruzadinha nÃ£o forma uma rede Ãºnica.");
  }
  if (connectivity.isolatedCount > 0) {
    issues.push("HÃ¡ palavra isolada sem cruzamento.");
  }

  for (let number = 1; number <= board.placements.length; number++) {
    if (!seenNumbers.has(number)) {
      issues.push("Todas as pistas precisam ter numeraÃ§Ã£o Ãºnica e sequencial.");
      break;
    }
  }

  return { valid: issues.length === 0, issues };
}

function createDeterministicRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function orderCrosswordSeedsForAttempt(
  seeds: GameSeedTerm[],
  attempt: number,
  rng: () => number,
): GameSeedTerm[] {
  return [...seeds].sort((a, b) => {
    const scoreA =
      scoreSeedForCrossword(a, seeds) +
      Math.sin((attempt + 1) * (stableHash(a.answer) % 997)) * 14 +
      rng() * 18;
    const scoreB =
      scoreSeedForCrossword(b, seeds) +
      Math.sin((attempt + 1) * (stableHash(b.answer) % 997)) * 14 +
      rng() * 18;
    if (scoreB !== scoreA) return scoreB - scoreA;
    return b.answer.length - a.answer.length;
  });
}

function applyCrosswordCandidate(
  state: CrosswordSearchState,
  seedIndex: number,
  candidate: CrosswordPlacementCandidate,
): CrosswordSearchState {
  const seed = state.remaining[seedIndex];
  const grid = cloneCrosswordGrid(state.grid);
  placeCrossword(grid, seed.answer, candidate.row, candidate.col, candidate.direction);
  const remaining = state.remaining.filter((_, index) => index !== seedIndex);
  const placements = [
    ...state.placements,
    {
      number: state.placements.length + 1,
      answer: seed.answer,
      label: seed.label,
      clue: seed.clue,
      row: candidate.row,
      col: candidate.col,
      direction: candidate.direction,
    },
  ];
  return { grid, placements, remaining };
}

function enumerateCrosswordBranches(
  state: CrosswordSearchState,
  allSeeds: GameSeedTerm[],
  attemptSalt: string,
  options: { branchLimit: number; candidatesPerWord: number },
): Array<{ seedIndex: number; candidate: CrosswordPlacementCandidate }> {
  const jitter = (value: string) => {
    const raw = stableHash(`${attemptSalt}:${value}`) % 1000;
    return raw / 1000 - 0.5;
  };
  const branches: Array<{ seedIndex: number; candidate: CrosswordPlacementCandidate }> = [];

  for (let seedIndex = 0; seedIndex < state.remaining.length; seedIndex++) {
    const seed = state.remaining[seedIndex];
    const candidates = findCrosswordPlacementCandidates(
      state,
      seed,
      allSeeds,
      options.candidatesPerWord,
      (value) => jitter(`${seedIndex}:${value}`) * 34,
    );
    for (const candidate of candidates) {
      branches.push({ seedIndex, candidate: { ...candidate, seedIndex } });
    }
  }

  return branches
    .sort((a, b) => b.candidate.score - a.candidate.score)
    .slice(0, options.branchLimit);
}

function initialCrosswordState(
  seeds: GameSeedTerm[],
  size: number,
  attempt: number,
  rng: () => number,
): CrosswordSearchState | null {
  if (!seeds.length) return null;
  const first = seeds[0];
  const direction = attempt % 2 === 0 ? "across" : "down";
  const grid = makeCrosswordGrid(size);
  const center = Math.floor(size / 2);
  const maxOffset = Math.max(1, Math.min(3, Math.floor(size / 8)));
  const offsetRow = Math.floor(rng() * (maxOffset * 2 + 1)) - maxOffset;
  const offsetCol = Math.floor(rng() * (maxOffset * 2 + 1)) - maxOffset;
  const row =
    direction === "across"
      ? Math.max(1, Math.min(size - 2, center + offsetRow))
      : Math.max(1, Math.min(size - first.answer.length - 1, center - Math.floor(first.answer.length / 2) + offsetRow));
  const col =
    direction === "across"
      ? Math.max(1, Math.min(size - first.answer.length - 1, center - Math.floor(first.answer.length / 2) + offsetCol))
      : Math.max(1, Math.min(size - 2, center + offsetCol));

  if (row < 0 || col < 0 || row >= size || col >= size) return null;
  placeCrossword(grid, first.answer, row, col, direction);
  return {
    grid,
    placements: [
      {
        number: 1,
        answer: first.answer,
        label: first.label,
        clue: first.clue,
        row,
        col,
        direction,
      },
    ],
    remaining: seeds.slice(1),
  };
}

function searchCrosswordFromState(
  initialState: CrosswordSearchState,
  allSeeds: GameSeedTerm[],
  targetCount: number,
  attemptSalt: string,
  best: { board: CrosswordBoard | null; score: number },
  options: { maxNodes: number; branchLimit: number; candidatesPerWord: number },
) {
  let nodes = 0;

  function visit(state: CrosswordSearchState) {
    nodes += 1;
    const board = {
      grid: state.grid,
      placements: renumberCrosswordPlacements(state.placements),
    };
    const score = scoreCrosswordBoard(board, targetCount);
    const validation = validateCrosswordBoard(board);
    if (validation.valid && score > best.score) {
      best.board = board;
      best.score = score;
    }

    if (nodes >= options.maxNodes || state.placements.length >= targetCount || state.remaining.length === 0) {
      return;
    }

    const optimisticPlaced = Math.min(targetCount, state.placements.length + state.remaining.length);
    const optimisticScore = score + (optimisticPlaced - state.placements.length) * 3300 + 1800;
    if (best.board && optimisticScore < best.score) {
      return;
    }

    const branches = enumerateCrosswordBranches(state, allSeeds, attemptSalt, options);
    for (const branch of branches) {
      if (nodes >= options.maxNodes) return;
      visit(applyCrosswordCandidate(state, branch.seedIndex, branch.candidate));
    }
  }

  visit(initialState);
}

function beamSearchCrossword(
  initialState: CrosswordSearchState,
  allSeeds: GameSeedTerm[],
  targetCount: number,
  attemptSalt: string,
  best: { board: CrosswordBoard | null; score: number },
  options: { beamWidth: number; branchLimit: number; candidatesPerWord: number },
) {
  let beam = [initialState];
  for (let depth = initialState.placements.length; depth < targetCount; depth++) {
    const nextStates: Array<{ state: CrosswordSearchState; score: number }> = [];
    for (const state of beam) {
      const branches = enumerateCrosswordBranches(state, allSeeds, `${attemptSalt}:beam:${depth}`, options);
      for (const branch of branches) {
        const nextState = applyCrosswordCandidate(state, branch.seedIndex, branch.candidate);
        const board = {
          grid: nextState.grid,
          placements: renumberCrosswordPlacements(nextState.placements),
        };
        const score = scoreCrosswordBoard(board, targetCount);
        const validation = validateCrosswordBoard(board);
        if (validation.valid && score > best.score) {
          best.board = board;
          best.score = score;
        }
        nextStates.push({ state: nextState, score });
      }
    }
    if (!nextStates.length) return;
    beam = nextStates
      .sort((a, b) => b.score - a.score)
      .slice(0, options.beamWidth)
      .map((item) => item.state);
  }
}

function buildCrosswordOptimizedBoard(
  seeds: GameSeedTerm[],
  targetCount: number,
  size: number,
  attempts: number,
): CrosswordBoard | null {
  const best: { board: CrosswordBoard | null; score: number } = {
    board: null,
    score: Number.NEGATIVE_INFINITY,
  };
  const pool = seeds.slice(0, Math.min(seeds.length, Math.max(targetCount + 8, targetCount)));
  const maxNodes = targetCount > 15 ? 92 : targetCount > 10 ? 118 : 150;
  const branchLimit = targetCount > 15 ? 5 : 6;
  const candidatesPerWord = targetCount > 15 ? 3 : 4;

  for (let attempt = 0; attempt < attempts; attempt++) {
    const rng = createDeterministicRng(stableHash(`${size}:${attempt}:${pool.map((seed) => seed.answer).join("|")}`));
    const ordered = orderCrosswordSeedsForAttempt(pool, attempt, rng);
    const firstIndex = attempt % Math.min(pool.length, Math.max(1, targetCount + 4));
    const first = ordered[firstIndex] || ordered[0];
    const seedsForAttempt = [first, ...ordered.filter((seed) => seed.answer !== first.answer)];
    const initialState = initialCrosswordState(seedsForAttempt, size, attempt, rng);
    if (!initialState) continue;

    searchCrosswordFromState(
      initialState,
      pool,
      targetCount,
      `${size}:${attempt}:bt`,
      best,
      { maxNodes, branchLimit, candidatesPerWord },
    );

    if (attempt % 7 === 0) {
      beamSearchCrossword(
        initialState,
        pool,
        targetCount,
        `${size}:${attempt}:beam`,
        best,
        {
          beamWidth: targetCount > 15 ? 7 : 9,
          branchLimit: Math.max(3, branchLimit - 1),
          candidatesPerWord: Math.max(2, candidatesPerWord - 1),
        },
      );
    }
  }

  return best.board;
}

function buildCrosswordBoard(input: MaterialAIInput, aiOutput?: MaterialOutputWithSeed): CrosswordBoard {
  const requestedCount = Math.max(5, Math.min(20, Number(input.quantidade) || 10));
  const rawSeeds = buildCrosswordSeeds(input, aiOutput);
  const seeds = sortCrosswordSeeds(
    uniqueByAnswer(rawSeeds).filter(isViableCrosswordSeed),
  );
  const availableSeeds = seeds.length ? seeds : DEFAULT_SEEDS;
  const targetCount = Math.min(requestedCount, availableSeeds.length);
  const longest = availableSeeds.reduce((max, seed) => Math.max(max, seed.answer.length), 8);
  const maxSize = targetCount > 15 ? 31 : targetCount > 10 ? 27 : 23;
  const minSize = targetCount > 15 ? 21 : targetCount > 10 ? 17 : 13;
  const baseSize = Math.min(maxSize, Math.max(minSize, longest + 8, targetCount + 7));
  const sizes = Array.from(
    new Set([
      baseSize,
      Math.min(maxSize, baseSize + 2),
      Math.min(maxSize, baseSize + 4),
    ]),
  );
  const totalAttempts = targetCount > 15 ? 1400 : targetCount > 10 ? 1150 : 850;
  const attemptsPerSize = Math.max(120, Math.ceil(totalAttempts / sizes.length));
  let bestBoard: CrosswordBoard | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const size of sizes) {
    const board = buildCrosswordOptimizedBoard(availableSeeds, targetCount, size, attemptsPerSize);
    if (!board) continue;
    const score = scoreCrosswordBoard(board, targetCount);
    if (score > bestScore) {
      bestBoard = board;
      bestScore = score;
    }
  }

  if (bestBoard) {
    return bestBoard;
  }

  const fallbackGrid = makeCrosswordGrid(baseSize);
  const first = availableSeeds[0] || DEFAULT_SEEDS[0];
  const startRow = Math.floor(baseSize / 2);
  const startCol = Math.max(1, Math.floor((baseSize - first.answer.length) / 2));
  placeCrossword(fallbackGrid, first.answer, startRow, startCol, "across");
  return {
    grid: fallbackGrid,
    placements: renumberCrosswordPlacements([
      {
        number: 1,
        answer: first.answer,
        label: first.label,
        clue: first.clue,
        row: startRow,
        col: startCol,
        direction: "across",
      },
    ]),
  };
}

function crosswordBounds(board: CrosswordBoard) {
  const used: Array<[number, number]> = [];
  for (let row = 0; row < board.grid.length; row++) {
    for (let col = 0; col < board.grid[row].length; col++) {
      if (board.grid[row][col]) used.push([row, col]);
    }
  }
  const rows = used.map(([row]) => row);
  const cols = used.map(([, col]) => col);
  return {
    minRow: Math.max(0, Math.min(...rows) - 1),
    maxRow: Math.min(board.grid.length - 1, Math.max(...rows) + 1),
    minCol: Math.max(0, Math.min(...cols) - 1),
    maxCol: Math.min(board.grid.length - 1, Math.max(...cols) + 1),
  };
}

function renderCrosswordGrid(board: CrosswordBoard, showAnswers: boolean, cellSize = 28): string {
  const bounds = crosswordBounds(board);
  const numberMap = new Map<string, number[]>();
  for (const placement of board.placements) {
    const key = `${placement.row}:${placement.col}`;
    const numbers = numberMap.get(key) || [];
    if (!numbers.includes(placement.number)) numbers.push(placement.number);
    numberMap.set(key, numbers);
  }

  const rows: string[] = [];
  // build a map of accented letters for placements when showing answers
  const accentedLetters = new Map<string, string>();
  if (showAnswers) {
    for (const placement of board.placements) {
      // try known full-word mappings first, then attempt a generic accent restore
      const normalized = placement.answer;
      const candidate = COMMON_CROSSWORD_DISPLAY_ACCENTS[normalized];
      const restored = candidate || restorePortugueseTextAccents(placement.answer.toLocaleLowerCase("pt-BR")) || placement.answer;
      const display = String(restored).toLocaleUpperCase("pt-BR");
      const { dr, dc } = crosswordDirectionDelta(placement.direction);
      for (let i = 0; i < placement.answer.length; i++) {
        const r = placement.row + dr * i;
        const c = placement.col + dc * i;
        const key = `${r}:${c}`;
        if (!accentedLetters.has(key) && display[i]) {
          accentedLetters.set(key, display[i]);
        }
      }
    }
  }
  for (let row = bounds.minRow; row <= bounds.maxRow; row++) {
    const cells: string[] = [];
    for (let col = bounds.minCol; col <= bounds.maxCol; col++) {
      const letter = board.grid[row]?.[col] || "";
      const numbers = numberMap.get(`${row}:${col}`) || [];
      if (!letter) {
        cells.push(`<td class="planify-game-cell--void"></td>`);
      } else {
        // numbers will be rendered in an overlay layer to avoid layout quirks
        const key = `${row}:${col}`;
        const renderedLetter = showAnswers ? escapeHtml(accentedLetters.get(key) || letter) : "";
        cells.push(`<td class="planify-game-cell--letter">
          ${renderedLetter}
        </td>`);
      }
    }
    rows.push(`<tr>${cells.join("")}</tr>`);
  }

  const tableHtml = `<div class="planify-game-board" style="position: relative; display: inline-block; width: ${(bounds.maxCol - bounds.minCol + 1) * cellSize}px; height: ${(bounds.maxRow - bounds.minRow + 1) * cellSize}px;">
    <table class="planify-game-table planify-game-table--crossword" style="table-layout: fixed; width: 100%; border-spacing: 0;">${rows.join("")}</table>`;

  // build overlay with absolute positioned numbers placed just in front of the
  // starting square (slightly above the top edge, visually in front of the box)
  const overlays: string[] = [];
  // font size and vertical offset scale with cellSize
  const numberFont = Math.max(6, Math.round(cellSize * 0.28));
  const verticalOffset = Math.round(cellSize * 0.28); // how far above the cell the number sits
  const horizontalInset = Math.max(1, Math.round(cellSize * 0.06));
  for (const [key, nums] of numberMap.entries()) {
    const [rStr, cStr] = key.split(":");
    const r = Number(rStr);
    const c = Number(cStr);
    // position the number slightly above the cell, and a little inset from the left
    const top = (r - bounds.minRow) * cellSize - verticalOffset;
    const left = (c - bounds.minCol) * cellSize + horizontalInset;
    const sorted = nums.slice().sort((a, b) => a - b);
    overlays.push(
      `<span class="planify-game-cell-number" aria-hidden="true" style="position:absolute; top:${top}px; left:${left}px; font-size:${numberFont}px; z-index:4;">${escapeHtml(
        sorted.join(","),
      )}</span>`,
    );
  }

  const overlayHtml = `<div style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none;">${overlays.join("")}</div>`;

  return `${tableHtml}${overlayHtml}</div>`;
}

function renderCrosswordClues(board: CrosswordBoard) {
  const across = board.placements.filter((placement) => placement.direction === "across");
  const down = board.placements.filter((placement) => placement.direction === "down");
  const renderList = (items: CrosswordPlacement[]) =>
    items.length
      ? `<ol class="planify-game-clues-list">${items.map((item) => `<li><strong>${item.number}.</strong> ${escapeHtml(displayCrosswordClue(item))}</li>`).join("")}</ol>`
      : `<p>Nenhuma pista nesta direÃ§Ã£o.</p>`;

  return `<table class="planify-game-clues-table" role="presentation">
    <tr>
      <td><h3>HORIZONTAL</h3>${renderList(across)}</td>
      <td><h3>VERTICAL</h3>${renderList(down)}</td>
    </tr>
  </table>`;
}

function dataSection(titulo: string, conteudo: string, itens: string[] = []): MaterialAISection {
  return { titulo, conteudo, itens };
}

function commonOutput(
  input: MaterialAIInput,
  label: string,
  visualHtml: string,
  sections: MaterialAISection[],
  gabarito: string[],
): MaterialAIOutput {
  const tema = normalizeText(input.tema) || "tema estudado";
  const conteudos = splitItems(input.conteudos);

  return {
    titulo: normalizeText(input.titulo) || `${label} — ${tema}`,
    subtitulo: `${label} para ${normalizeText(input.anoSerie) || "turma"}`,
    tipo: "jogo",
    resumo: `Jogo pedagógico visual, contextualizado ao tema ${tema}, pronto para editar, imprimir e aplicar em sala.`,
    dadosGerais: {
      escola: input.escola || "",
      professor: input.professor || "",
      etapa: input.etapa,
      anoSerie: input.anoSerie,
      areaConhecimento: input.areaConhecimento || "",
      componenteCurricular: input.componenteCurricular,
      tema,
      duracao: input.duracao || "",
    },
    objetivos: [
      `Retomar conceitos essenciais relacionados a ${tema}.`,
      "Promover aprendizagem ativa por meio de desafio visual e colaboração.",
      "Registrar evidências de compreensão durante a correção coletiva.",
    ],
    conteudos,
    orientacoesProfessor: [
      "Imprima a versão do aluno e mantenha o gabarito apenas com o professor.",
      "Antes do jogo, retome rapidamente o tema e os conceitos usados nas pistas.",
      "Durante a aplicação, peça que os estudantes justifiquem as respostas encontradas.",
      "Finalize com correção coletiva, retomada dos conceitos e registro de aprendizagem.",
    ],
    orientacoesAluno: [
      "Leia o comando e as pistas com atenção antes de iniciar.",
      "Procure relacionar cada resposta ao conteúdo estudado em aula.",
      "Ao corrigir, explique como chegou às respostas e anote os pontos que precisa revisar.",
    ],
    introducao: `Material visual gerado para o tema ${tema}, com estrutura pronta para uso em sala de aula.`,
    secoes: sections,
    questoes: [],
    jogo: {
      nome: label,
      tipoJogo: label,
      objetivo: `Revisar e consolidar o tema ${tema} por meio de jogo pedagógico visual.`,
      materiais: ["Material impresso", "Lápis ou caneta", "Quadro para correção coletiva"],
      preparacao: ["Abrir no Editor se desejar ajustar termos ou pistas.", "Imprimir a versão do aluno.", "Separar o gabarito para uso do professor."],
      regras: ["Realizar individualmente, em dupla ou em grupo.", "Registrar as respostas de forma organizada.", "Justificar ao menos três respostas durante a socialização."],
      modoDeJogar: ["Ler as pistas ou comandos.", "Resolver o jogo no tempo combinado.", "Conferir em correção coletiva.", "Registrar a aprendizagem principal."],
      variacoes: ["Transformar em competição por equipes.", "Pedir que os estudantes criem novas pistas.", "Usar como revisão antes de avaliação."],
      fechamento: "Finalize retomando conceitos, esclarecendo dúvidas e relacionando o jogo aos objetivos da aula.",
    },
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
      "Ler comandos e pistas em voz alta para garantir compreensão.",
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

export function buildVisualGameMaterial(input: MaterialAIInput, aiOutput?: MaterialOutputWithSeed): MaterialAIOutput {
  const model = normalizeModel(input.modeloJogo);
  const label = GAME_LABELS[model];
  const tema = normalizeText(input.tema) || "tema estudado";
  const seeds = buildSeeds(input, aiOutput, 30);
  let visualHtml = "";
  let sections: MaterialAISection[] = [];
  let gabarito: string[] = [];

  if (model === "caca_palavras") {
    const game = wordSearch(input, aiOutput);
    const words = game.placed.map((item) => item.word);
    visualHtml = `
      <section class="planify-game-section">
        <h2>Caça-palavras — versão do aluno</h2>
        <p>Encontre as palavras relacionadas ao tema <strong>${escapeHtml(tema)}</strong>. Depois escolha três palavras e escreva uma frase explicando cada uma.</p>
        ${renderGridTable(game.grid)}
        <h3>Banco de palavras</h3>
        ${renderWordBank(words)}
        <h3>Pistas rápidas</h3>
        <ol>${game.placed.map((item) => `<li>${escapeHtml(item.clue)}</li>`).join("")}</ol>
        <div class="planify-game-teacher-block">
          <h2>Gabarito do professor</h2>
          <table class="planify-game-data-table"><tr><th>Palavra</th><th>Início</th><th>Direção</th></tr>${game.placed
            .map((item) => `<tr><td>${escapeHtml(item.word)}</td><td>linha ${item.row}, coluna ${item.col}</td><td>${escapeHtml(item.direction)}</td></tr>`)
            .join("")}</table>
        </div>
      </section>`;
    sections = [
      dataSection("Grade visual do caça-palavras", "Grade em quadradinhos, banco de palavras, pistas e gabarito."),
      dataSection("Palavras do jogo", "Palavras que aparecem na grade:", words),
    ];
    gabarito = game.placed.map((item) => `${item.word}: linha ${item.row}, coluna ${item.col}, ${item.direction}. Pista: ${item.clue}`);
  }

  if (model === "cruzadinha") {
    const board = buildCrosswordBoard(input, aiOutput);
    const placedCount = board.placements.length;
    const intersectionCount = countCrosswordIntersections(board);
    const sizeClass = placedCount > 15
      ? " planify-crossword-print--xl"
      : placedCount > 10
        ? " planify-crossword-print--large"
        : "";
    const cellSize = placedCount > 15 ? 20 : placedCount > 10 ? 24 : 28;
    visualHtml = `
      <section class="planify-game-section planify-crossword-print${sizeClass}">
        <div class="planify-crossword-page planify-crossword-page--student">
          ${renderCrosswordGrid(board, false, cellSize)}
          ${renderCrosswordClues(board)}
        </div>
        <div class="planify-game-teacher-block planify-crossword-page planify-crossword-page--answer">
          <h2>Gabarito do professor</h2>
          ${renderCrosswordGrid(board, true, cellSize)}
          <ul class="planify-crossword-answer-list">${board.placements.map((item) => `<li><strong>${item.number}. ${escapeHtml(displayCrosswordAnswer(item))}</strong> &mdash; ${escapeHtml(displayCrosswordClue(item))}</li>`).join("")}</ul>
        </div>
      </section>`;
    sections = [
      dataSection("Cruzadinha visual conectada", `A cruzadinha foi montada com ${placedCount} termos na grade, ${intersectionCount} cruzamentos, pistas horizontais/verticais e gabarito.`),
      dataSection("Pistas da cruzadinha", "Pistas para os estudantes:", board.placements.map((row) => `${row.number}. ${displayCrosswordClue(row)}`)),
    ];
    gabarito = board.placements.map((row) => `${row.number}. ${displayCrosswordAnswer(row)} - ${displayCrosswordClue(row)}`);
  }

  if (model === "bingo") {
    const cards = bingoCards(input, aiOutput);
    const callList = seeds.slice(0, 28);
    visualHtml = `
      <section class="planify-game-section">
        <h2>Bingo pedagógico — cartelas para imprimir</h2>
        <p>O professor sorteia as pistas. Os estudantes marcam na cartela o termo correspondente.</p>
        <div class="planify-game-bingo-grid">${cards.map(renderBingoCard).join("")}</div>
        <div class="planify-game-teacher-block">
          <h2>Lista de chamada do professor</h2>
          <table class="planify-game-data-table"><tr><th>Termo</th><th>Pista de chamada</th></tr>${callList
            .map((seed) => `<tr><td><strong>${escapeHtml(seed.label)}</strong></td><td>${escapeHtml(seed.clue)}</td></tr>`)
            .join("")}</table>
        </div>
      </section>`;
    sections = [
      dataSection("Cartelas visuais de bingo", "Seis cartelas diferentes em tabela 4x4."),
      dataSection("Lista de chamada", "Itens para sorteio ou leitura pelo professor:", callList.map((seed) => `${seed.label}: ${seed.clue}`)),
    ];
    gabarito = callList.map((seed, index) => `${index + 1}. ${seed.label}: ${seed.clue}`);
  }

  if (model === "memoria") {
    const pairs = seeds.slice(0, 12);
    const cards = pairs.flatMap((seed, index) => [
      { title: `Par ${index + 1}A`, body: seed.label, footer: "Carta conceito" },
      { title: `Par ${index + 1}B`, body: seed.clue, footer: "Carta pista" },
    ]);
    visualHtml = `
      <section class="planify-game-section">
        <h2>Jogo da memória — cartas recortáveis</h2>
        <p>Recorte as cartas. O par correto une a carta de conceito à carta de pista.</p>
        ${renderPrintableCards(cards)}
        <div class="planify-game-teacher-block">
          <h2>Gabarito do professor</h2>
          <ol>${pairs.map((seed, index) => `<li>Par ${index + 1}: ${escapeHtml(seed.label)} ↔ ${escapeHtml(seed.clue)}</li>`).join("")}</ol>
        </div>
      </section>`;
    sections = [
      dataSection("Cartas visuais recortáveis", "Cartas em grade, com bordas tracejadas para recorte."),
      dataSection("Pares corretos", "Relação conceito ↔ pista:", pairs.map((seed, index) => `Par ${index + 1}: ${seed.label} ↔ ${seed.clue}`)),
    ];
    gabarito = pairs.map((seed, index) => `Par ${index + 1}: ${seed.label} ↔ ${seed.clue}`);
  }

  if (model === "domino") {
    const pieces = seeds.slice(0, 14);
    const cards = pieces.map((seed, index) => {
      const next = pieces[(index + 1) % pieces.length] || pieces[0];
      return {
        title: `Peça ${index + 1}`,
        body: `${seed.label}  |  ${next.clue}`,
        footer: "Recorte na borda tracejada e encaixe pela associação correta.",
      };
    });
    visualHtml = `
      <section class="planify-game-section">
        <h2>Dominó pedagógico — peças recortáveis</h2>
        <p>Cada peça tem dois lados. Encaixe a resposta ao conceito ou pista correspondente.</p>
        ${renderPrintableCards(cards)}
        <div class="planify-game-teacher-block">
          <h2>Sequência sugerida do gabarito</h2>
          <ol>${pieces.map((seed, index) => `<li>Peça ${index + 1}: ${escapeHtml(seed.label)} deve conectar com pista de ${escapeHtml(pieces[(index + 1) % pieces.length]?.label || pieces[0]?.label || "termo")}</li>`).join("")}</ol>
        </div>
      </section>`;
    sections = [
      dataSection("Peças visuais do dominó", "Peças retangulares recortáveis com dois lados."),
      dataSection("Sequência de conferência", "Sequência sugerida para correção:", pieces.map((seed, index) => `Peça ${index + 1}: ${seed.label}`)),
    ];
    gabarito = pieces.map((seed, index) => `Peça ${index + 1}: ${seed.label}.`);
  }

  if (model === "quiz") {
    const quizSeeds = seeds.slice(0, 12);
    const questions = quizSeeds.map((seed, index) => ({
      title: `Pergunta ${index + 1}`,
      body: `${seed.clue} Qual é o conceito ou termo estudado? Justifique com uma frase relacionada ao tema ${tema}.`,
      footer: "Valor sugerido: 1 ponto pela resposta + 1 ponto pela justificativa.",
    }));
    visualHtml = `
      <section class="planify-game-section">
        <h2>Quiz pedagógico — cartões de pergunta</h2>
        <p>Use os cartões em equipes, duplas ou individualmente. A resposta precisa ter justificativa.</p>
        ${renderPrintableCards(questions)}
        <h2>Folha de pontuação</h2>
        <table class="planify-game-data-table"><tr><th>Equipe</th><th>Rodada 1</th><th>Rodada 2</th><th>Total</th></tr>${[1, 2, 3, 4].map((row) => `<tr><td>Equipe ${row}</td><td></td><td></td><td></td></tr>`).join("")}</table>
      </section>`;
    sections = [
      dataSection("Cartões visuais do quiz", "Cartões de perguntas prontos para imprimir e recortar."),
      dataSection("Perguntas", "Perguntas do quiz:", questions.map((question) => question.body)),
    ];
    gabarito = quizSeeds.map((seed, index) => `Pergunta ${index + 1}: ${seed.label}. Justificativa esperada: ${seed.clue}`);
  }

  if (model === "cartas") {
    const source = seeds.slice(0, 24);
    const cards = source.map((seed, index) => ({
      title: `Carta ${index + 1}`,
      body: `${seed.label} — ${seed.clue}`,
      footer: index % 4 === 0 ? "Carta desafio" : index % 4 === 1 ? "Carta exemplo" : index % 4 === 2 ? "Carta associação" : "Carta síntese",
    }));
    visualHtml = `
      <section class="planify-game-section">
        <h2>Baralho pedagógico — cartas recortáveis</h2>
        <p>Recorte as cartas e use como revisão, estações de aprendizagem, sorteio de desafios ou jogo em equipes.</p>
        ${renderPrintableCards(cards)}
        <h2>Modo rápido de aplicação</h2>
        <ol><li>Cada grupo compra uma carta.</li><li>Responde com justificativa.</li><li>Outro grupo pode complementar.</li><li>O professor valida e pontua.</li></ol>
      </section>`;
    sections = [
      dataSection("Baralho visual recortável", "Cartas em grade com bordas tracejadas."),
      dataSection("Cartas do baralho", "Itens gerados:", cards.map((card) => `${card.title}: ${card.body}`)),
    ];
    gabarito = source.slice(0, 16).map((seed, index) => `Carta ${index + 1}: resposta deve relacionar ${seed.label} ao tema ${tema}. Pista base: ${seed.clue}`);
  }

  if (model === "trilha") {
    const steps = seeds.slice(0, 20);
    const cells = steps.map((seed, index) => {
      const challenge = index % 5 === 4;
      const bg = challenge ? "#fffbeb" : index === 0 ? "#ecfdf5" : "#eef2ff";
      const border = index === 0 ? "#059669" : challenge ? "#d97706" : "#6366f1";
      return `
        <div style="border:2px solid ${border};border-radius:12px;background:${bg};padding:10px;min-height:88px;display:flex;flex-direction:column;justify-content:space-between;">
          <span style="font-size:11px;font-weight:800;color:${border};">Casa ${index + 1}${index === 0 ? " · INÍCIO" : challenge ? " · DESAFIO" : ""}</span>
          <strong style="font-size:13px;line-height:1.35;color:#0f172a;">${escapeHtml(seed.label)}</strong>
          <span style="font-size:11px;line-height:1.4;color:#475569;">${escapeHtml(seed.clue)}</span>
        </div>`;
    });

    visualHtml = `
      <section class="planify-game-section">
        <h2>Trilha pedagógica — tabuleiro imprimível</h2>
        <p>Imprima o tabuleiro. Cada equipe lança um dado, avança e responde à casa. Casas de desafio (⭐) valem ponto extra com justificativa.</p>
        <div class="planify-game-cards-grid">${cells.join("")}</div>
        <h3>Regras rápidas</h3>
        <ol>
          <li>Forme equipes e escolha um peão por grupo.</li>
          <li>Na casa, responda com base no conceito indicado.</li>
          <li>Acerto: permanece; erro: volta uma casa (ajuste conforme a turma).</li>
          <li>Desafio: resposta completa com exemplo ganha +1 ponto.</li>
          <li>Primeira equipe a cruzar a casa 20 vence.</li>
        </ol>
        <h3>Folha de pontuação</h3>
        <table class="planify-game-data-table"><tr><th>Equipe</th><th>Pontos</th><th>Observações</th></tr>${[1, 2, 3, 4].map((row) => `<tr><td>Equipe ${row}</td><td></td><td></td></tr>`).join("")}</table>
        <div class="planify-game-teacher-block">
          <h2>Gabarito do professor</h2>
          <ol>${steps.map((seed, index) => `<li><strong>Casa ${index + 1}:</strong> ${escapeHtml(seed.label)} — resposta esperada relacionada a: ${escapeHtml(seed.clue)}</li>`).join("")}</ol>
        </div>
      </section>`;
    sections = [
      dataSection("Tabuleiro da trilha", "Grade 5×4 com casas numeradas, início, desafios e pistas."),
      dataSection("Casas do tabuleiro", "Conceitos por casa:", steps.map((seed, index) => `Casa ${index + 1}: ${seed.label}`)),
    ];
    gabarito = steps.map(
      (seed, index) =>
        `Casa ${index + 1}: ${seed.label}. Esperado: relacionar ao tema ${tema} usando ${seed.clue}`,
    );
  }

  return commonOutput(input, label, visualHtml.trim(), sections, gabarito);
}
