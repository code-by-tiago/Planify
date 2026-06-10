import type { BNCCSkill } from "../../types/bncc";
import {
  filterBnccSkillsByContext,
  rankBnccSkillsForContent,
  readBNCCSkills,
} from "./bncc-service";

type UnknownRecord = Record<string, unknown>;

export type BnccSkillSuggestion = {
  id: string;
  codigo: string;
  descricao: string;
  texto: string;
  label: string;
  etapa?: string;
  anoSerie?: string;
  area?: string;
  componente?: string;
  conteudo: string;
  score: number;
  source: "local" | "fallback";
};

export type BnccSuggestionPayload = {
  etapa?: string;
  anoSerie?: string;
  serie?: string;
  ano?: string;
  areaConhecimento?: string;
  area?: string;
  componenteCurricular?: string;
  componente?: string;
  conteudos?: string | string[];
  conteudo?: string;
  contents?: string[];
  temaCentral?: string;
  tema?: string;
  excludeCodigos?: string[];
  refresh?: boolean;
  offset?: number;
};

type SkillCandidate = {
  codigo: string;
  descricao: string;
  etapa?: string;
  anoSerie?: string;
  area?: string;
  componente?: string;
  rawText: string;
  source: "local" | "fallback";
};

const STOP_WORDS = new Set([
  "para",
  "com",
  "sem",
  "dos",
  "das",
  "uma",
  "por",
  "que",
  "nas",
  "nos",
  "aos",
  "aulas",
  "aula",
  "conteudo",
  "conteudos",
  "tema",
  "central",
  "uso",
  "sobre",
  "como",
  "entre",
  "pela",
  "pelo",
  "suas",
  "seus",
  "sua",
  "seu",
  "de",
  "do",
  "da",
  "e",
  "o",
  "a",
  "os",
  "as",
  "em",
  "no",
  "na",
]);

const FALLBACK_SKILLS: SkillCandidate[] = [
  {
    codigo: "EM13LGG101",
    descricao:
      "Compreender e analisar processos de produção e circulação de discursos, nas diferentes linguagens, para fazer escolhas fundamentadas em função de interesses pessoais e coletivos.",
    etapa: "Ensino Médio",
    area: "Linguagens e suas Tecnologias",
    componente: "Língua Portuguesa",
    rawText:
      "discursos linguagens produção circulação escolhas fundamentadas texto gêneros argumentação",
    source: "fallback",
  },
  {
    codigo: "EM13LGG102",
    descricao:
      "Analisar visões de mundo, conflitos de interesse, preconceitos e ideologias presentes nos discursos veiculados nas diferentes mídias.",
    etapa: "Ensino Médio",
    area: "Linguagens e suas Tecnologias",
    componente: "Língua Portuguesa",
    rawText:
      "discurso mídia repertório sociocultural ideologia argumento ponto de vista dados fontes",
    source: "fallback",
  },
  {
    codigo: "EM13LP05",
    descricao:
      "Analisar, em textos argumentativos, os posicionamentos assumidos, os movimentos argumentativos e os argumentos utilizados para sustentá-los.",
    etapa: "Ensino Médio",
    area: "Linguagens e suas Tecnologias",
    componente: "Língua Portuguesa",
    rawText:
      "texto argumentativo dissertação tese argumento repertório sociocultural proposta intervenção enunciado",
    source: "fallback",
  },
  {
    codigo: "EM13LP06",
    descricao:
      "Analisar efeitos de sentido decorrentes de escolhas linguísticas, recursos expressivos, coesão, coerência e adequação ao contexto de produção.",
    etapa: "Ensino Médio",
    area: "Linguagens e suas Tecnologias",
    componente: "Língua Portuguesa",
    rawText:
      "norma padrão coesão coerência linguagem registro texto produção escrita gramática",
    source: "fallback",
  },
  {
    codigo: "EF69LP07",
    descricao:
      "Produzir textos em diferentes gêneros, considerando sua adequação ao contexto de produção, circulação e recepção.",
    etapa: "Ensino Fundamental",
    componente: "Língua Portuguesa",
    rawText:
      "produção textual gênero texto contexto escrita planejamento revisão circulação recepção",
    source: "fallback",
  },
  {
    codigo: "EF69LP08",
    descricao:
      "Revisar e editar textos, considerando coesão, coerência, ortografia, pontuação e adequação ao gênero proposto.",
    etapa: "Ensino Fundamental",
    componente: "Língua Portuguesa",
    rawText:
      "revisão textual coesão coerência ortografia pontuação norma padrão edição escrita",
    source: "fallback",
  },
  {
    codigo: "EF05HI01",
    descricao:
      "Identificar os processos de formação das culturas e dos povos, relacionando-os com o espaço geográfico ocupado.",
    etapa: "Ensino Fundamental",
    componente: "História",
    rawText:
      "povos culturas formação sociedade território brasil história memória diversidade",
    source: "fallback",
  },
  {
    codigo: "EF05HI02",
    descricao:
      "Identificar os mecanismos de organização do poder político com vistas à compreensão da ideia de Estado.",
    etapa: "Ensino Fundamental",
    componente: "História",
    rawText:
      "estado poder político organização sociedade história brasil colonização",
    source: "fallback",
  },
];

const SPANISH_EM_SKILLS: SkillCandidate[] = [
  {
    codigo: "EM13LGG102",
    descricao:
      "Analisar visões de mundo, conflitos de interesse, preconceitos e ideologias presentes nos discursos veiculados nas diferentes mídias, ampliando suas possibilidades de explicação, interpretação e intervenção crítica da/na realidade.",
    etapa: "Ensino Médio",
    anoSerie: "1ª a 3ª série",
    area: "Linguagens e suas Tecnologias",
    componente: "Língua Espanhola",
    rawText:
      "gramática verbos vocabulário léxico estrutura linguística análise linguística variação discursos mídias linguagem",
    source: "local",
  },
  {
    codigo: "EM13LGG301",
    descricao:
      "Participar de processos de produção individual e colaborativa em diferentes linguagens (artísticas, corporais e verbais), levando em conta suas formas e seus funcionamentos, para produzir sentidos em diferentes contextos.",
    etapa: "Ensino Médio",
    anoSerie: "1ª a 3ª série",
    area: "Linguagens e suas Tecnologias",
    componente: "Língua Espanhola",
    rawText:
      "leitura interpretação compreensão produção textual escrita oralidade textos gêneros sentidos práticas de linguagem",
    source: "local",
  },
  {
    codigo: "EM13LGG401",
    descricao:
      "Analisar criticamente textos de modo a compreender e caracterizar as línguas como fenômeno (geo)político, histórico, social, cultural, variável, heterogêneo e sensível aos contextos de uso.",
    etapa: "Ensino Médio",
    anoSerie: "1ª a 3ª série",
    area: "Linguagens e suas Tecnologias",
    componente: "Língua Espanhola",
    rawText:
      "cultura hispânica países literatura diversidade global línguas fenômeno geopolítico histórico social cultural variação",
    source: "local",
  },
];

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

function normalizeSearch(value: unknown): string {
  return normalizeText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[_/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getRecordValue(record: UnknownRecord, keys: string[]): unknown {
  for (const key of keys) {
    const value = record[key];

    if (value !== null && value !== undefined && normalizeText(value)) {
      return value;
    }
  }

  return "";
}

function getString(payload: BnccSuggestionPayload, keys: string[], fallback = ""): string {
  const source = payload as UnknownRecord;
  const value = getRecordValue(source, keys);

  return normalizeText(value) || fallback;
}

function splitContents(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => splitContents(item))
      .map((item) => item.trim())
      .filter(Boolean);
  }

  const text = normalizeText(value);

  if (!text) {
    return [];
  }

  // Conteúdos costumam vir um por linha; vírgulas internas não devem fragmentar o tópico.
  if (/\r?\n/.test(text)) {
    return text
      .split(/\r?\n+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return text
    .split(/;|\s·\s|,/u)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function extractExcludeCodigosFromPayload(
  payload: BnccSuggestionPayload,
): Set<string> {
  const raw = (payload as UnknownRecord).excludeCodigos;

  if (!Array.isArray(raw)) {
    return new Set();
  }

  return new Set(
    raw
      .map((item) => String(item ?? "").trim().toUpperCase())
      .filter(Boolean),
  );
}

export function isBnccRefreshRequest(payload: BnccSuggestionPayload): boolean {
  const value = (payload as UnknownRecord).refresh;

  return value === true || String(value).toLowerCase() === "true";
}

export function getBnccRefreshOffset(payload: BnccSuggestionPayload): number {
  const value = Number((payload as UnknownRecord).offset);

  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
}

export function extractConteudosFromPayload(payload: BnccSuggestionPayload): string[] {
  const byConteudos = splitContents(payload.conteudos);

  if (byConteudos.length > 0) {
    return byConteudos;
  }

  const byConteudo = splitContents(payload.conteudo);

  if (byConteudo.length > 0) {
    return byConteudo;
  }

  const byContents = splitContents(payload.contents);

  if (byContents.length > 0) {
    return byContents;
  }

  const theme = getString(payload, ["temaCentral", "tema"]);

  return theme ? [theme] : [];
}

function looksLikeSkill(record: UnknownRecord): boolean {
  return Boolean(
    record.codigo ||
      record["código"] ||
      record.code ||
      record.habilidade ||
      record.habilidade_codigo ||
      record.descricao ||
      record["descrição"] ||
      record.description ||
      record.texto,
  );
}

function flatten(value: unknown, limit = 20000): unknown[] {
  const output: unknown[] = [];
  const stack: unknown[] = [value];

  while (stack.length > 0 && output.length < limit) {
    const current = stack.pop();

    if (!current) {
      continue;
    }

    if (Array.isArray(current)) {
      for (const item of current) {
        stack.push(item);
      }

      continue;
    }

    if (typeof current === "object") {
      const record = current as UnknownRecord;

      if (looksLikeSkill(record)) {
        output.push(record);
        continue;
      }

      for (const item of Object.values(record)) {
        stack.push(item);
      }

      continue;
    }

    if (typeof current === "string" && current.length > 8) {
      output.push(current);
    }
  }

  return output;
}

function parseSkillCode(text: string): string {
  return (
    text
      .match(
        /[A-Z]{2}\d{2}[A-Z]{2}\d{2,3}|EM\d{2}[A-Z]{2}\d{2,3}|EF\d{2}[A-Z]{2}\d{2}/i,
      )?.[0]
      ?.toUpperCase() || ""
  );
}

function normalizeCandidate(value: unknown, source: "local" | "fallback"): SkillCandidate | null {
  if (typeof value === "string") {
    const codigo = parseSkillCode(value);
    const descricao = codigo
      ? value.replace(codigo, "").replace(/^[-–—:.\s]+/, "").trim()
      : value;

    if (!codigo && descricao.length < 18) {
      return null;
    }

    return {
      codigo: codigo || "BNCC",
      descricao,
      rawText: value,
      source,
    };
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as UnknownRecord;
  const allText = Object.values(record).map(normalizeText).join(" ");
  const codigo =
    normalizeText(
      getRecordValue(record, [
        "codigo",
        "código",
        "code",
        "habilidade_codigo",
        "habilidade",
      ]),
    ) || parseSkillCode(allText);

  const descricao = normalizeText(
    getRecordValue(record, [
      "descricao",
      "descrição",
      "description",
      "texto",
      "objeto",
      "nome",
    ]),
  );

  if (!codigo && !descricao) {
    return null;
  }

  return {
    codigo: codigo || "BNCC",
    descricao: descricao || allText || "Descrição não informada.",
    etapa: normalizeText(getRecordValue(record, ["etapa", "nivel", "segmento"])),
    anoSerie: normalizeText(
      getRecordValue(record, ["anoSerie", "ano_serie", "ano", "serie"]),
    ),
    area: normalizeText(
      getRecordValue(record, ["area", "areaConhecimento", "area_conhecimento"]),
    ),
    componente: normalizeText(
      getRecordValue(record, ["componente", "componenteCurricular", "disciplina"]),
    ),
    rawText: allText,
    source,
  };
}

let cachedCatalogSkills: SkillCandidate[] | null = null;

function bnccSkillToCandidate(skill: {
  codigo: string;
  descricao: string;
  etapa?: string;
  ano?: string;
  serie?: string;
  areaConhecimento?: string;
  componente?: string;
}): SkillCandidate {
  return {
    codigo: skill.codigo,
    descricao: skill.descricao,
    etapa: skill.etapa,
    anoSerie: skill.ano || skill.serie,
    area: skill.areaConhecimento,
    componente: skill.componente,
    rawText: [skill.codigo, skill.descricao, skill.componente, skill.areaConhecimento]
      .filter(Boolean)
      .join(" "),
    source: "local",
  };
}

async function loadCatalogSkills(): Promise<SkillCandidate[]> {
  if (cachedCatalogSkills) {
    return cachedCatalogSkills;
  }

  const skills = await readBNCCSkills();
  cachedCatalogSkills = skills.map(bnccSkillToCandidate);
  return cachedCatalogSkills;
}

function expandTerms(content: string): string[] {
  const normalized = normalizeSearch(content);
  const terms = new Set(
    normalized
      .split(/[^a-z0-9]+/)
      .map((term) => term.trim())
      .filter((term) => term.length >= 4 && !STOP_WORDS.has(term)),
  );

  const synonymGroups: Array<[RegExp, string[]]> = [
    [
      /dissert|argument|tese|redacao|enem/,
      [
        "argumentativo",
        "argumentacao",
        "argumentos",
        "tese",
        "repertorio",
        "sociocultural",
        "intervencao",
        "posicionamento",
        "ponto",
        "vista",
      ],
    ],
    [
      /norma|padrao|gramatica|coesao|coerencia/,
      ["coesao", "coerencia", "norma", "padrao", "registro", "linguistica"],
    ],
    [
      /repertorio|sociocultural|dados|filosofia|literatura|historia/,
      ["repertorio", "sociocultural", "fontes", "dados", "argumentos", "discursos"],
    ],
    [
      /texto|genero|narracao|descricao/,
      ["texto", "genero", "discursos", "linguagem", "producao"],
    ],
    [
      /leitura|interpretacao|infer/,
      ["leitura", "interpretacao", "sentidos", "inferir", "informacoes"],
    ],
    [
      /sintaxe|semantica|orac|coordenad|subordinad|reduzid|regencia|crase|pronominal|periodo|concordancia|colocacao/,
      [
        "sintaxe",
        "semantica",
        "oracoes",
        "coordenacao",
        "subordinacao",
        "regencia",
        "crase",
        "pronominal",
        "concordancia",
        "periodo",
        "gramatica",
        "sintagmas",
      ],
    ],
  ];

  for (const [pattern, additions] of synonymGroups) {
    if (pattern.test(normalized)) {
      for (const term of additions) {
        terms.add(term);
      }
    }
  }

  return Array.from(terms);
}

type PayloadStage = "ensino_medio" | "ensino_fundamental" | "educacao_infantil" | null;

function resolvePayloadStage(payload: BnccSuggestionPayload): PayloadStage {
  const etapa = normalizeSearch(getString(payload, ["etapa"]));

  if (etapa.includes("medio")) {
    return "ensino_medio";
  }

  if (etapa.includes("fundamental")) {
    return "ensino_fundamental";
  }

  if (etapa.includes("infantil")) {
    return "educacao_infantil";
  }

  if (isHighSchoolPayload(payload)) {
    return "ensino_medio";
  }

  const anoSerie = normalizeSearch(getString(payload, ["anoSerie", "serie", "ano"]));

  if (/\b([1-9])\D{0,3}ano\b/.test(anoSerie)) {
    return "ensino_fundamental";
  }

  return null;
}

function codeMatchesPayloadStage(code: string, stage: PayloadStage): boolean {
  if (!stage) {
    return true;
  }

  const normalized = code.toUpperCase();

  if (stage === "ensino_medio") {
    return normalized.startsWith("EM");
  }

  if (stage === "ensino_fundamental") {
    return normalized.startsWith("EF");
  }

  if (stage === "educacao_infantil") {
    return normalized.startsWith("EI");
  }

  return true;
}

function candidateMatchesPayloadStage(
  candidate: SkillCandidate,
  payload: BnccSuggestionPayload,
): boolean {
  const stage = resolvePayloadStage(payload);

  if (!stage) {
    return true;
  }

  return codeMatchesPayloadStage(candidate.codigo, stage);
}

// Série/ano alvo informado pelo professor (1..9 no Fundamental).
// No Ensino Médio, "3ª série" não deve casar com habilidades EF03.
function getTargetGrade(payload: BnccSuggestionPayload): number | null {
  if (isHighSchoolPayload(payload) || resolvePayloadStage(payload) === "ensino_medio") {
    return null;
  }

  const anoSerie = normalizeSearch(getString(payload, ["anoSerie", "serie", "ano"]));
  const direct = anoSerie.match(/([1-9])\D{0,3}(?:ano|serie)/);

  if (direct) {
    return Number(direct[1]);
  }

  const etapa = normalizeSearch(getString(payload, ["etapa"]));

  if (etapa.includes("fundamental")) {
    const loose = anoSerie.match(/\b([1-9])\b/);
    return loose ? Number(loose[1]) : null;
  }

  return null;
}

// Faixa de anos/séries coberta por uma habilidade, a partir do campo ano/série
// e, como reforço, do próprio código BNCC (ex.: EF35 = 3º ao 5º, EF69 = 6º ao 9º).
function candidateGradeRange(candidate: SkillCandidate): { min: number; max: number } | null {
  const text = normalizeSearch(candidate.anoSerie);
  const range = text.match(/([1-9])\D{0,4}(?:ao|a)\D{0,4}([1-9])/);

  if (range) {
    const a = Number(range[1]);
    const b = Number(range[2]);

    return { min: Math.min(a, b), max: Math.max(a, b) };
  }

  const single = text.match(/([1-9])\D{0,3}(?:ano|serie)/) || text.match(/\b([1-9])\b/);

  if (single) {
    const grade = Number(single[1]);

    return { min: grade, max: grade };
  }

  const codeMatch = candidate.codigo.toUpperCase().match(/^EF(\d)(\d)/);

  if (codeMatch) {
    const a = Number(codeMatch[1]);
    const b = Number(codeMatch[2]);

    if (a === 0) {
      return { min: b, max: b };
    }

    return { min: Math.min(a, b), max: Math.max(a, b) };
  }

  return null;
}

function scoreCandidate(
  candidate: SkillCandidate,
  content: string,
  payload: BnccSuggestionPayload,
): number {
  const terms = expandTerms(content);
  const candidateText = normalizeSearch(
    `${candidate.codigo} ${candidate.descricao} ${candidate.rawText}`,
  );
  const etapa = normalizeSearch(getString(payload, ["etapa"]));
  const anoSerie = normalizeSearch(getString(payload, ["anoSerie", "serie", "ano"]));
  const area = normalizeSearch(getString(payload, ["areaConhecimento", "area"]));
  const componente = normalizeSearch(
    getString(payload, ["componenteCurricular", "componente"]),
  );

  let score = 0;

  for (const term of terms) {
    if (candidateText.includes(term)) {
      score += 5;
    }
  }

  if (candidate.etapa && etapa && normalizeSearch(candidate.etapa).includes(etapa)) {
    score += 10;
  }

  if (candidate.anoSerie && anoSerie && normalizeSearch(candidate.anoSerie).includes(anoSerie)) {
    score += 5;
  }

  if (candidate.area && area && normalizeSearch(candidate.area).includes(area)) {
    score += 10;
  }

  if (
    candidate.componente &&
    componente &&
    normalizeSearch(candidate.componente).includes(componente)
  ) {
    score += 12;
  }

  if (candidateText.includes(componente)) {
    score += 4;
  }

  if (candidateText.includes(area)) {
    score += 4;
  }

  if (etapa.includes("medio") && candidate.codigo.startsWith("EM")) {
    score += 8;
  }

  if (etapa.includes("fundamental") && candidate.codigo.startsWith("EF")) {
    score += 8;
  }

  if (componente.includes("lingua portuguesa") && /LP|LGG/.test(candidate.codigo)) {
    score += 6;
  }

  if (
    (componente.includes("redacao") ||
      componente.includes("redação") ||
      componente.includes("escrita criativa")) &&
    /LP|LGG/.test(candidate.codigo)
  ) {
    score += 14;
  }

  const targetGrade = getTargetGrade(payload);
  const gradeRange = candidateGradeRange(candidate);

  if (targetGrade && gradeRange) {
    if (targetGrade >= gradeRange.min && targetGrade <= gradeRange.max) {
      score += 40;
    } else {
      score -= 30;
    }
  }

  return score;
}

function scoreContentTerms(candidate: SkillCandidate, content: string): number {
  const terms = expandTerms(content);
  const candidateText = normalizeSearch(
    `${candidate.codigo} ${candidate.descricao} ${candidate.rawText}`,
  );
  let score = 0;

  for (const term of terms) {
    if (candidateText.includes(term)) {
      score += 5;
    }
  }

  return score;
}

// Restringe os candidatos ao componente/etapa informados para nunca sugerir
// habilidades de outra disciplina ou de outro nível escolar.
function filterByContext(
  candidates: SkillCandidate[],
  payload: BnccSuggestionPayload,
): SkillCandidate[] {
  let result = candidates;

  const componente = normalizeSearch(
    getString(payload, ["componenteCurricular", "componente"]),
  );

  if (componente) {
    const exact = result.filter(
      (candidate) => normalizeSearch(candidate.componente) === componente,
    );
    const loose = result.filter((candidate) => {
      const value = normalizeSearch(candidate.componente);

      return value && (value.includes(componente) || componente.includes(value));
    });

    if (exact.length > 0) {
      result = exact;
    } else if (loose.length > 0) {
      result = loose;
    } else if (componente.includes("lingua portuguesa")) {
      const lpEm = candidates.filter((candidate) =>
        /^EM13LP/.test(candidate.codigo.toUpperCase()),
      );

      if (lpEm.length > 0) {
        result = lpEm;
      }
    }
  }

  const stage = resolvePayloadStage(payload);

  if (stage) {
    result = result.filter((candidate) =>
      candidateMatchesPayloadStage(candidate, payload),
    );
  }

  const etapa = normalizeSearch(getString(payload, ["etapa"]));

  if (etapa) {
    const byEtapa = result.filter((candidate) => {
      const value = normalizeSearch(candidate.etapa);

      return value && (value.includes(etapa) || etapa.includes(value));
    });

    if (byEtapa.length > 0) {
      result = byEtapa;
    }
  }

  return result;
}

function isPortugueseComponent(payload: BnccSuggestionPayload): boolean {
  const value = normalizeSearch(
    [
      getString(payload, ["componenteCurricular", "componente"]),
      getString(payload, ["areaConhecimento", "area"]),
    ].join(" "),
  );

  return (
    value.includes("lingua portuguesa") ||
    (value.includes("portugues") &&
      !value.includes("espanhol") &&
      !value.includes("espanhola"))
  );
}

function isSpanishComponent(payload: BnccSuggestionPayload): boolean {
  const value = normalizeSearch(
    [
      getString(payload, ["componenteCurricular", "componente"]),
      getString(payload, ["areaConhecimento", "area"]),
    ].join(" "),
  );

  return (
    value.includes("lingua espanhola") ||
    value.includes("espanhol") ||
    value.includes("espanola") ||
    value.includes("lengua espanola")
  );
}

function isHighSchoolPayload(payload: BnccSuggestionPayload): boolean {
  const value = normalizeSearch(
    [
      getString(payload, ["etapa"]),
      getString(payload, ["anoSerie", "serie", "ano"]),
    ].join(" "),
  );

  return (
    value.includes("ensino medio") ||
    value.includes("medio") ||
    value.includes("1 serie") ||
    value.includes("1a serie") ||
    value.includes("1ª serie") ||
    value.includes("2 serie") ||
    value.includes("2a serie") ||
    value.includes("2ª serie") ||
    value.includes("3 serie") ||
    value.includes("3a serie") ||
    value.includes("3ª serie")
  );
}

function getFundamentalGrade(payload: BnccSuggestionPayload): number | null {
  const value = normalizeSearch(
    [getString(payload, ["anoSerie", "serie", "ano"]), getString(payload, ["etapa"])].join(
      " ",
    ),
  );
  const match = value.match(/\b([6-9])\b/);

  return match ? Number(match[1]) : null;
}

function isFundamentalSpanishPayload(payload: BnccSuggestionPayload): boolean {
  const etapa = normalizeSearch(getString(payload, ["etapa"]));

  return isSpanishComponent(payload) && !isHighSchoolPayload(payload) && (
    etapa.includes("fundamental") || getFundamentalGrade(payload) !== null
  );
}

function buildSuggestionFromCandidate(
  candidate: SkillCandidate,
  content: string,
  index: number,
  score: number,
): BnccSkillSuggestion {
  const codigo = candidate.codigo || `BNCC-${index + 1}`;
  const descricao = candidate.descricao || candidate.rawText;

  return {
    id: `${codigo}-${normalizeSearch(content).slice(0, 28)}-${index}`,
    codigo,
    descricao,
    texto: `${codigo} — ${descricao}`,
    label: `${codigo} — ${descricao}`,
    etapa: candidate.etapa,
    anoSerie: candidate.anoSerie,
    area: candidate.area,
    componente: candidate.componente,
    conteudo: content,
    score,
    source: candidate.source,
  };
}

function classifySpanishHighSchoolSkills(content: string): SkillCandidate[] {
  const normalized = normalizeSearch(content);
  const selected: SkillCandidate[] = [];

  const grammarPattern =
    /gramatic|gramatica|verbo|verbos|conjug|tempo verbal|presente|preterito|pretérito|futuro|imperativo|subjuntivo|ser\b|estar\b|tener\b|haber\b|gustar|pronome|pronombres|artigo|articulos|artículo|substantivo|sustantivo|adjetivo|adverbio|preposi|conect|vocab|vocabulario|vocabulário|lexico|léxico|numerais|numeros|alfabeto|pronuncia|fonetica|fonética/;
  const readingPattern =
    /leitura|leer|lectura|interpret|compreens|comprension|compreensão|texto|textos|escrita|escribir|redacao|redação|producao textual|produção textual|oralidade|oral|fala|escuta|dialogo|diálogo|conversa|entrevista|genero textual|gênero textual|carta|email|e-mail|noticia|notícia|resenha|relato|roteiro|argument|opiniao|opinião/;
  const culturePattern =
    /cultura|cultural|hispan|hispânico|hispanico|hispano|paises|países|pais|país|america latina|américa latina|latino|espanha|mexico|méxico|argentina|uruguai|paraguai|chile|colombia|colômbia|peru|bolivia|bolívia|literatura|literario|literário|poesia|poema|conto|romance|autor|autores|obra|obras|diversidade|identidade|festividade|celebracao|celebração|dia de los muertos|mundo global|global|variedade|variacao|variação|sotaque|dialeto/;

  if (grammarPattern.test(normalized)) {
    selected.push(SPANISH_EM_SKILLS[0]);
  }

  if (readingPattern.test(normalized)) {
    selected.push(SPANISH_EM_SKILLS[1]);
  }

  if (culturePattern.test(normalized)) {
    selected.push(SPANISH_EM_SKILLS[2]);
  }

  if (selected.length === 0) {
    selected.push(SPANISH_EM_SKILLS[2]);
  }

  const unique = new Map<string, SkillCandidate>();

  for (const skill of selected) {
    unique.set(skill.codigo, skill);
  }

  return Array.from(unique.values());
}

function pickPortugueseEmSkillPool(catalog: SkillCandidate[]): Map<string, SkillCandidate> {
  const pool = new Map<string, SkillCandidate>();

  for (const candidate of catalog) {
    const code = candidate.codigo.toUpperCase();

    if (/^EM13(LP|LGG)/.test(code)) {
      pool.set(code, candidate);
    }
  }

  for (const candidate of FALLBACK_SKILLS) {
    const code = candidate.codigo.toUpperCase();

    if (/^EM13(LP|LGG)/.test(code) && !pool.has(code)) {
      pool.set(code, candidate);
    }
  }

  return pool;
}

function classifyPortugueseHighSchoolSkills(
  content: string,
  catalog: SkillCandidate[],
): SkillCandidate[] {
  const pool = pickPortugueseEmSkillPool(catalog);
  const get = (code: string) => pool.get(code.toUpperCase()) || null;
  const normalized = normalizeSearch(content);
  const selected: SkillCandidate[] = [];

  const syntaxPattern =
    /sintaxe|semantica|orac|coordenad|subordinad|reduzid|regencia|crase|pronominal|periodo|concordancia|colocacao|gramatica/;
  const cohesionPattern = /coesao|coerencia/;
  const genrePattern =
    /tipos de texto|descricao|narracao|dissert|genero|estrutura dissertativa|argumentativ|tese|introducao|conclusao|desenvolvimento/;
  const enemPattern = /enem|norma|padrao|intervencao/;
  const repertoirePattern =
    /repertorio|sociocultural|dados|filosofia|literatura|historia/;

  if (syntaxPattern.test(normalized)) {
    for (const code of ["EM13LP08", "EM13LP07", "EM13LP15"]) {
      const skill = get(code);

      if (skill) {
        selected.push(skill);
      }
    }
  }

  if (cohesionPattern.test(normalized)) {
    const skill = get("EM13LP02");

    if (skill) {
      selected.push(skill);
    }
  }

  if (genrePattern.test(normalized)) {
    for (const code of ["EM13LP01", "EM13LP05"]) {
      const skill = get(code);

      if (skill) {
        selected.push(skill);
      }
    }
  }

  if (enemPattern.test(normalized)) {
    for (const code of ["EM13LP09", "EM13LP15"]) {
      const skill = get(code);

      if (skill) {
        selected.push(skill);
      }
    }
  }

  if (repertoirePattern.test(normalized)) {
    for (const code of ["EM13LP04", "EM13LP12", "EM13LGG102"]) {
      const skill = get(code);

      if (skill) {
        selected.push(skill);
      }
    }
  }

  if (selected.length === 0) {
    const fallback = get("EM13LP08") || get("EM13LP01");

    if (fallback) {
      selected.push(fallback);
    }
  }

  const unique = new Map<string, SkillCandidate>();

  for (const skill of selected) {
    unique.set(skill.codigo, skill);
  }

  return Array.from(unique.values()).slice(0, 3);
}

function buildPortugueseHighSchoolResponse(
  payload: BnccSuggestionPayload,
  conteudos: string[],
  catalog: SkillCandidate[],
) {
  const grouped = conteudos.map((conteudo, contentIndex) => {
    const classified = classifyPortugueseHighSchoolSkills(conteudo, catalog);

    return {
      conteudo,
      habilidades: classified.map((candidate, index) =>
        buildSuggestionFromCandidate(candidate, conteudo, index, 100 - index),
      ),
    };
  });
  const habilidades = grouped.flatMap((group) => group.habilidades);

  return {
    conteudos: grouped,
    habilidades,
    sugeridas: habilidades,
    skills: habilidades,
    items: habilidades,
    data: {
      conteudos: grouped,
      habilidades,
      sugeridas: habilidades,
    },
    total: habilidades.length,
    source: "local",
    message:
      "Língua Portuguesa no Ensino Médio usa habilidades EM13LP distribuídas por conteúdo conforme eixo pedagógico.",
  };
}

function buildSpanishHighSchoolRefreshResponse(
  conteudos: string[],
  excludeCodigos: Set<string>,
) {
  const grouped = conteudos.map((conteudo) => ({
    conteudo,
    habilidades: classifySpanishHighSchoolSkills(conteudo)
      .filter((candidate) => !excludeCodigos.has(candidate.codigo.toUpperCase()))
      .slice(0, 3)
      .map((candidate, index) =>
        buildSuggestionFromCandidate(candidate, conteudo, index, 100 - index),
      ),
  }));
  const habilidades = grouped.flatMap((group) => group.habilidades);

  return {
    conteudos: grouped,
    habilidades,
    sugeridas: habilidades,
    skills: habilidades,
    items: habilidades,
    data: {
      conteudos: grouped,
      habilidades,
      sugeridas: habilidades,
    },
    total: habilidades.length,
    source: "local" as const,
    message:
      habilidades.length > 0
        ? "Novas alternativas de habilidades BNCC para os conteúdos informados."
        : "Sem outras opções compatíveis com este conteúdo.",
  };
}

function buildSpanishHighSchoolResponse(payload: BnccSuggestionPayload, conteudos: string[]) {
  const grouped = conteudos.map((conteudo) => ({
    conteudo,
    habilidades: classifySpanishHighSchoolSkills(conteudo)
      .slice(0, 2)
      .map((candidate, index) =>
        buildSuggestionFromCandidate(candidate, conteudo, index, 100 - index),
      ),
  }));
  const habilidades = grouped.flatMap((group) => group.habilidades);

  return {
    conteudos: grouped,
    habilidades,
    sugeridas: habilidades,
    skills: habilidades,
    items: habilidades,
    data: {
      conteudos: grouped,
      habilidades,
      sugeridas: habilidades,
    },
    total: habilidades.length,
    source: "local",
    message:
      "Língua Espanhola no Ensino Médio usa habilidades da área de Linguagens e suas Tecnologias, distribuídas por conteúdo sem repetição em massa.",
  };
}

function gradeFromCode(code: string): number | null {
  const match = code.toUpperCase().match(/^EF0([6-9])LI/);

  return match ? Number(match[1]) : null;
}

function scoreSpanishFundamentalCandidate(
  candidate: SkillCandidate,
  content: string,
  axis: "grammar" | "reading" | "culture",
): number {
  const text = normalizeSearch(`${candidate.codigo} ${candidate.descricao} ${candidate.rawText}`);
  const contentTerms = expandTerms(content);
  let score = 0;

  for (const term of contentTerms) {
    if (text.includes(term)) {
      score += 4;
    }
  }

  if (axis === "grammar") {
    if (/gramatic|conhecimento linguistico|linguistic|verbo|verbais|vocab|lexic|lexical|repertorio lexical|presente|passado|futuro|imperativo|conector|pronome|modal/.test(text)) {
      score += 25;
    }
  }

  if (axis === "reading") {
    if (/oral|leitura|ler|texto|textos|compreens|informac|hipotese|sentido|escrita|produzir|planejar|revisar|partilha|interagir/.test(text)) {
      score += 25;
    }
  }

  if (axis === "culture") {
    if (/intercultural|cultura|cultural|sociedade|comunidade|mundo|globalizado|variacao|variacao linguistica|preconceito|lingua inglesa na sociedade/.test(text)) {
      score += 25;
    }
  }

  return score;
}

function classifySpanishFundamentalAxis(content: string): "grammar" | "reading" | "culture" {
  const normalized = normalizeSearch(content);

  if (/cultura|hispan|paises|países|pais|país|literatura|festividade|historia|história|diversidade|variedade|variacao|variação|sotaque|dialeto|america latina|américa latina/.test(normalized)) {
    return "culture";
  }

  if (/leitura|interpret|texto|escrita|producao|produção|oral|dialogo|diálogo|audio|áudio|musica|música|canção|cancao|entrevista|noticia|notícia|genero|gênero/.test(normalized)) {
    return "reading";
  }

  return "grammar";
}

function rankSpanishFundamentalForContent(
  conteudo: string,
  payload: BnccSuggestionPayload,
  candidates: SkillCandidate[],
  options?: { excludeCodigos?: Set<string>; limit?: number },
) {
  const grade = getFundamentalGrade(payload);
  const filtered = candidates.filter((candidate) => {
    const code = candidate.codigo.toUpperCase();

    return code.startsWith("EF") && code.includes("LI") && (!grade || gradeFromCode(code) === grade);
  });

  if (filtered.length === 0) {
    return [];
  }

  const axis = classifySpanishFundamentalAxis(conteudo);
  const exclude = options?.excludeCodigos;
  const limit = options?.limit ?? 3;

  return filtered
    .map((candidate) => ({
      candidate,
      score: scoreSpanishFundamentalCandidate(candidate, conteudo, axis),
    }))
    .filter((item) => item.score > 0)
    .filter(
      (item) => !exclude?.size || !exclude.has(item.candidate.codigo.toUpperCase()),
    )
    .sort((a, b) => b.score - a.score || a.candidate.codigo.localeCompare(b.candidate.codigo))
    .slice(0, limit);
}

function buildSpanishFundamentalRefreshResponse(
  payload: BnccSuggestionPayload,
  conteudos: string[],
  candidates: SkillCandidate[],
  excludeCodigos: Set<string>,
) {
  const grouped = conteudos.map((conteudo) => {
    const chosen = rankSpanishFundamentalForContent(conteudo, payload, candidates, {
      excludeCodigos,
      limit: 3,
    });

    return {
      conteudo,
      habilidades: chosen.map(({ candidate, score }, index) =>
        buildSuggestionFromCandidate(candidate, conteudo, index, score),
      ),
    };
  });
  const habilidades = grouped.flatMap((group) => group.habilidades);

  return {
    conteudos: grouped,
    habilidades,
    sugeridas: habilidades,
    skills: habilidades,
    items: habilidades,
    data: {
      conteudos: grouped,
      habilidades,
      sugeridas: habilidades,
    },
    total: habilidades.length,
    source: "local" as const,
    message:
      habilidades.length > 0
        ? "Novas alternativas de habilidades BNCC para os conteúdos informados."
        : "Sem outras opções compatíveis com este conteúdo.",
  };
}

function buildSpanishFundamentalResponse(
  payload: BnccSuggestionPayload,
  conteudos: string[],
  candidates: SkillCandidate[],
) {
  const grade = getFundamentalGrade(payload);
  const filtered = candidates.filter((candidate) => {
    const code = candidate.codigo.toUpperCase();

    return code.startsWith("EF") && code.includes("LI") && (!grade || gradeFromCode(code) === grade);
  });

  if (filtered.length === 0) {
    return null;
  }

  const grouped = conteudos.map((conteudo) => {
    const ranked = rankSpanishFundamentalForContent(conteudo, payload, candidates, {
      limit: 2,
    });
    const chosen =
      ranked.length > 0
        ? ranked
        : filtered.slice(0, 1).map((candidate) => ({ candidate, score: 1 }));

    return {
      conteudo,
      habilidades: chosen.map(({ candidate, score }, index) =>
        buildSuggestionFromCandidate(candidate, conteudo, index, score),
      ),
    };
  });
  const habilidades = grouped.flatMap((group) => group.habilidades);

  return {
    conteudos: grouped,
    habilidades,
    sugeridas: habilidades,
    skills: habilidades,
    items: habilidades,
    data: {
      conteudos: grouped,
      habilidades,
      sugeridas: habilidades,
    },
    total: habilidades.length,
    source: "local",
    message:
      "Língua Espanhola no Ensino Fundamental foi tratada por espelhamento pedagógico das habilidades oficiais de Língua Inglesa do ano informado, com 1 ou 2 habilidades por conteúdo.",
  };
}

function chooseForContent(
  content: string,
  payload: BnccSuggestionPayload,
  candidates: SkillCandidate[],
  contentIndex = 0,
): BnccSkillSuggestion[] {
  const scored = candidates
    .map((candidate) => ({
      candidate,
      score: scoreCandidate(candidate, content, payload),
      termScore: scoreContentTerms(candidate, content),
    }))
    .sort(
      (a, b) =>
        b.termScore - a.termScore ||
        b.score - a.score ||
        a.candidate.codigo.localeCompare(b.candidate.codigo),
    );

  const stageFiltered = scored.filter((item) =>
    candidateMatchesPayloadStage(item.candidate, payload),
  );
  const ranked = stageFiltered.filter((item) => item.termScore > 0).slice(0, 3);

  const stageFallbacks = FALLBACK_SKILLS.filter((candidate) =>
    candidateMatchesPayloadStage(candidate, payload),
  );
  const rotatedFallbacks =
    stageFallbacks.length > 0
      ? [
          ...stageFallbacks.slice(contentIndex % stageFallbacks.length),
          ...stageFallbacks.slice(0, contentIndex % stageFallbacks.length),
        ]
      : [];

  // Mantém-se dentro do componente/etapa já filtrado; só recorre às habilidades
  // genéricas se não houver nenhum candidato local compatível.
  const chosen =
    ranked.length > 0
      ? ranked
      : stageFiltered.length > 0
        ? stageFiltered.slice(0, 3)
        : rotatedFallbacks
            .map((candidate) => ({
              candidate,
              score: scoreCandidate(candidate, content, payload),
              termScore: scoreContentTerms(candidate, content),
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);

  return chosen.map(({ candidate, score }, index) =>
    buildSuggestionFromCandidate(candidate, content, index, score),
  );
}

function bnccSkillToSuggestion(
  skill: BNCCSkill,
  content: string,
  index: number,
  score: number,
): BnccSkillSuggestion {
  const codigo = skill.codigo;
  const descricao = skill.descricao;

  return {
    id: `${codigo}-${normalizeSearch(content).slice(0, 28)}-${index}`,
    codigo,
    descricao,
    texto: `${codigo} — ${descricao}`,
    label: `${codigo} — ${descricao}`,
    etapa: skill.etapa,
    anoSerie: skill.ano || skill.serie,
    area: skill.areaConhecimento,
    componente: skill.componente,
    conteudo: content,
    score,
    source: "local",
  };
}

export async function suggestBnccByConteudos(payload: BnccSuggestionPayload) {
  const conteudos = extractConteudosFromPayload(payload);

  if (conteudos.length === 0) {
    return {
      conteudos: [],
      habilidades: [],
      total: 0,
      source: "empty",
      message: "Informe pelo menos um conteúdo para sugerir habilidades BNCC.",
    };
  }

  const refresh = isBnccRefreshRequest(payload);
  const refreshOffset = getBnccRefreshOffset(payload);
  const excludeCodigos = extractExcludeCodigosFromPayload(payload);

  const context = {
    etapa: getString(payload, ["etapa"]),
    anoSerie: getString(payload, ["anoSerie", "serie", "ano"]),
    componenteCurricular: getString(payload, ["componenteCurricular", "componente"]),
  };

  const catalog = await readBNCCSkills();

  if (isSpanishComponent(payload) && isHighSchoolPayload(payload)) {
    if (refresh) {
      return buildSpanishHighSchoolRefreshResponse(conteudos, excludeCodigos);
    }

    return buildSpanishHighSchoolResponse(payload, conteudos);
  }

  if (isFundamentalSpanishPayload(payload)) {
    const spanishCandidates = catalog.map(bnccSkillToCandidate);

    if (refresh) {
      return buildSpanishFundamentalRefreshResponse(
        payload,
        conteudos,
        spanishCandidates,
        excludeCodigos,
      );
    }

    const spanishFundamental = buildSpanishFundamentalResponse(
      payload,
      conteudos,
      spanishCandidates,
    );

    if (spanishFundamental) {
      return spanishFundamental;
    }
  }

  const filtered = filterBnccSkillsByContext(catalog, context);
  const usedCodes = new Set(excludeCodigos);

  const grouped = conteudos.map((conteudo, contentIndex) => {
    const ranked = rankBnccSkillsForContent(filtered, context, conteudo, {
      usedCodes,
      contentIndex: refresh ? refreshOffset : contentIndex,
      limit: 3,
      excludeCodigos: refresh ? excludeCodigos : undefined,
      requireContentMatch: refresh,
    });

    ranked.forEach((item) => usedCodes.add(item.skill.codigo));

    return {
      conteudo,
      habilidades: ranked.map(({ skill, score }, index) =>
        bnccSkillToSuggestion(skill, conteudo, index, score),
      ),
    };
  });

  const flattened = grouped.flatMap((group) => group.habilidades);
  const unique = new Map<string, BnccSkillSuggestion>();

  for (const skill of flattened) {
    const key = `${skill.codigo}-${skill.descricao}-${skill.conteudo}`;

    if (!unique.has(key)) {
      unique.set(key, skill);
    }
  }

  const habilidades = Array.from(unique.values());

  return {
    conteudos: grouped,
    habilidades,
    sugeridas: habilidades,
    skills: habilidades,
    items: habilidades,
    data: {
      conteudos: grouped,
      habilidades,
      sugeridas: habilidades,
    },
    total: habilidades.length,
    source: catalog.length > 0 ? "local" : "fallback",
    message:
      habilidades.length > 0
        ? refresh
          ? "Novas alternativas de habilidades BNCC para os conteúdos informados."
          : "Habilidades sugeridas a partir dos conteúdos informados."
        : refresh
          ? "Sem outras opções compatíveis com este conteúdo."
          : "Nenhuma habilidade encontrada para os conteúdos informados.",
  };
}
