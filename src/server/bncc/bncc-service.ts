import "server-only";

import type {
  BNCCSkill,
  BNCCStage,
  BNCCSuggestionRequest,
  BNCCSuggestionResponse,
} from "../../types/bncc";
import {
  countBnccSkillsInDb,
  fetchBnccSkillsFromDb,
  getCachedBnccSkills,
} from "./bncc-catalog-service";
import { resolveBnccCatalogSubjects } from "./discipline-catalog";
import {
  MIN_SUGGESTION_RELEVANCE_SCORE,
  RESCUE_SUGGESTION_RELEVANCE_SCORE,
} from "./bncc-suggestion-quality";
import { expandContentTerms } from "./bncc-term-expansion";
import { retrieveBnccCandidates } from "./bncc-retrieval";

export const BNCC_NOT_INSTALLED_MESSAGE =
  "Nenhuma base BNCC foi encontrada no Supabase. Execute o import para public.bncc_skills.";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number") {
    return String(value);
  }

  return "";
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => asString(item))
    .filter((item) => item.length > 0);
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string): string[] {
  const stopwords = new Set([
    "a",
    "as",
    "o",
    "os",
    "um",
    "uma",
    "uns",
    "umas",
    "de",
    "da",
    "das",
    "do",
    "dos",
    "em",
    "no",
    "na",
    "nos",
    "nas",
    "para",
    "por",
    "com",
    "sem",
    "sobre",
    "entre",
    "e",
    "ou",
    "ao",
    "aos",
    "que",
    "como",
    "se",
    "sua",
    "seu",
    "suas",
    "seus",
  ]);

  return normalizeText(value)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !stopwords.has(token));
}

function inferStageFromCode(code: string): BNCCStage {
  const normalized = code.trim().toUpperCase();

  if (normalized.startsWith("EF")) {
    return "ensino_fundamental";
  }

  if (normalized.startsWith("EM")) {
    return "ensino_medio";
  }

  if (normalized.startsWith("EI")) {
    return "educacao_infantil";
  }

  return "unknown";
}

function normalizeStage(value: string, code: string): BNCCStage {
  const normalized = normalizeText(value);

  if (normalized.includes("fundamental") || code.toUpperCase().startsWith("EF")) {
    return "ensino_fundamental";
  }

  if (normalized.includes("medio") || code.toUpperCase().startsWith("EM")) {
    return "ensino_medio";
  }

  if (normalized.includes("infantil") || code.toUpperCase().startsWith("EI")) {
    return "educacao_infantil";
  }

  return inferStageFromCode(code);
}

export type BnccContextFilter = {
  etapa?: string;
  anoSerie?: string;
  componenteCurricular?: string;
};

function parseGradeNumber(value: string): number | null {
  const text = normalizeText(value);
  const match =
    text.match(/([1-9])\D{0,3}(?:ano|serie)/) ||
    text.match(/\b([1-9])\b/);

  return match ? Number(match[1]) : null;
}

function skillGradeRange(skill: BNCCSkill): { min: number; max: number } | null {
  const text = normalizeText([skill.ano, skill.serie].filter(Boolean).join(" "));
  const range = text.match(/([1-9])\D{0,4}(?:ao|a)\D{0,4}([1-9])/);

  if (range) {
    const a = Number(range[1]);
    const b = Number(range[2]);

    return { min: Math.min(a, b), max: Math.max(a, b) };
  }

  const single = parseGradeNumber(text);

  if (single) {
    return { min: single, max: single };
  }

  const codeMatch = skill.codigo.toUpperCase().match(/^EF(\d)(\d)/);

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

function requestedGradeRange(requestedGrade: string): { min: number; max: number } | null {
  const text = normalizeText(requestedGrade);
  const range = text.match(/([1-9])\D{0,4}(?:ao|a)\D{0,4}([1-9])/);

  if (range) {
    const a = Number(range[1]);
    const b = Number(range[2]);

    return { min: Math.min(a, b), max: Math.max(a, b) };
  }

  const single = parseGradeNumber(text);

  return single ? { min: single, max: single } : null;
}

export function gradeMatches(skill: BNCCSkill, requestedGrade: string): boolean {
  if (!requestedGrade.trim()) {
    return true;
  }

  const requested = requestedGradeRange(requestedGrade);
  const skillRange = skillGradeRange(skill);

  if (!requested) {
    return true;
  }

  if (!skillRange) {
    return skill.codigo.startsWith("EM");
  }

  return requested.min >= skillRange.min && requested.min <= skillRange.max;
}

function componentAliasMatches(
  aliases: string[],
  component: string,
  area: string,
  strictComponentOnly: boolean,
): boolean {
  for (const alias of aliases) {
    if (!alias) {
      continue;
    }

    if (
      component &&
      (component.includes(alias) || alias.includes(component))
    ) {
      return true;
    }

    if (!strictComponentOnly && area && (area.includes(alias) || alias.includes(area))) {
      return true;
    }
  }

  return false;
}

export function componentMatches(skill: BNCCSkill, requestedComponent: string): boolean {
  if (!requestedComponent.trim()) {
    return true;
  }

  const aliases = resolveBnccCatalogSubjects(requestedComponent).map(normalizeText);
  const component = normalizeText(skill.componente || "");
  const area = normalizeText(skill.areaConhecimento || "");

  if (!component && !area) {
    return true;
  }

  const strictComponentOnly = Boolean(component);
  return componentAliasMatches(aliases, component, area, strictComponentOnly);
}

export function stageMatches(skill: BNCCSkill, requestedStage: string): boolean {
  if (!requestedStage) {
    return true;
  }

  const requested = normalizeStage(requestedStage, "");

  if (requested === "unknown") {
    return true;
  }

  return skill.etapa === requested;
}

function getRecordString(record: UnknownRecord, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" || typeof value === "number") {
      const text = asString(value);

      if (text) {
        return text;
      }
    }
  }

  return "";
}

function normalizeSkill(item: unknown, index: number): BNCCSkill | null {
  if (!isRecord(item)) {
    return null;
  }

  const codigo = getRecordString(item, ["codigo", "code", "habilidade", "id"]).toUpperCase();
  const descricao = getRecordString(item, ["descricao", "description", "texto", "habilidadeDescricao"]);

  if (!codigo || !descricao) {
    return null;
  }

  const etapaRaw = getRecordString(item, ["etapa", "educationStage", "nivel", "stage"]);
  const etapa = normalizeStage(etapaRaw, codigo);
  const ano = getRecordString(item, ["ano", "grade", "anoSerie"]);
  const serie = getRecordString(item, ["serie", "série", "series"]);
  const componente = getRecordString(item, ["componente", "componenteCurricular", "subject", "disciplina"]);
  const areaConhecimento = getRecordString(item, ["areaConhecimento", "áreaConhecimento", "knowledgeArea", "area"]);
  const unidadeTematica = getRecordString(item, ["unidadeTematica", "unidadeTemática", "thematicUnit"]);
  const objetoConhecimento = getRecordString(item, ["objetoConhecimento", "objetoDeConhecimento", "knowledgeObject"]);
  const camposExperiencia = getRecordString(item, ["camposExperiencia", "camposDeExperiencia"]);
  const explicitKeywords = asStringArray(item.keywords);

  const generatedKeywords = tokenize(
    [
      codigo,
      descricao,
      etapa,
      ano,
      serie,
      componente,
      areaConhecimento,
      unidadeTematica,
      objetoConhecimento,
      camposExperiencia,
    ].join(" "),
  );

  return {
    id: getRecordString(item, ["uuid", "uid"]) || codigo || `bncc-${index}`,
    codigo,
    descricao,
    etapa,
    ano: ano || undefined,
    serie: serie || undefined,
    componente: componente || undefined,
    areaConhecimento: areaConhecimento || undefined,
    unidadeTematica: unidadeTematica || undefined,
    objetoConhecimento: objetoConhecimento || undefined,
    camposExperiencia: camposExperiencia || undefined,
    keywords: Array.from(new Set([...explicitKeywords.map(normalizeText), ...generatedKeywords])).filter(Boolean),
    fonte: getRecordString(item, ["fonte", "source"]) || "BNCC oficial processada",
  };
}

function extractArrayFromJson(json: unknown): unknown[] {
  if (Array.isArray(json)) {
    return json;
  }

  if (isRecord(json)) {
    const possibleKeys = ["habilidades", "skills", "items", "data", "bncc"];

    for (const key of possibleKeys) {
      const value = json[key];

      if (Array.isArray(value)) {
        return value;
      }
    }
  }

  return [];
}

export async function hasInstalledBNCCBase(): Promise<boolean> {
  try {
    const count = await countBnccSkillsInDb();
    return count > 0;
  } catch {
    return false;
  }
}

export async function readBNCCSkills(filters?: {
  stage?: string | null;
  grade?: string | null;
  subject?: string | null;
}): Promise<BNCCSkill[]> {
  try {
    if (filters?.stage || filters?.grade || filters?.subject) {
      return removeDuplicateSkills(await fetchBnccSkillsFromDb(filters));
    }
    return removeDuplicateSkills(await getCachedBnccSkills());
  } catch {
    return [];
  }
}

export function removeDuplicateSkills(skills: BNCCSkill[]): BNCCSkill[] {
  const map = new Map<string, BNCCSkill>();

  for (const skill of skills) {
    const key = skill.codigo.trim().toUpperCase();

    if (!map.has(key)) {
      map.set(key, skill);
    }
  }

  return Array.from(map.values());
}

const GENERIC_MATCH_TERMS = new Set([
  "texto",
  "textos",
  "genero",
  "generos",
  "linguagem",
  "conteudo",
  "conteudos",
  "leitura",
  "escrita",
  "producao",
  "competencias",
  "habilidades",
  "conhecimento",
  "aprendizagem",
  "estudar",
  "estudar",
  "sociedade",
  "cultura",
  "historia",
  "numeros",
  "numero",
]);

export function calculateTextualRelevance(
  skill: BNCCSkill,
  request: BNCCSuggestionRequest,
  options?: {
    usedCodes?: Set<string>;
    contentIndex?: number;
    assertiveMode?: boolean;
  },
): number {
  const content = request.conteudo || "";
  const terms = expandContentTerms(content, {
    assertiveMode: options?.assertiveMode,
    componenteCurricular: request.componenteCurricular,
  });

  if (terms.length === 0) {
    return 0;
  }

  const searchableText = normalizeText(
    [
      skill.codigo,
      skill.descricao,
      skill.componente || "",
      skill.areaConhecimento || "",
      skill.unidadeTematica || "",
      skill.objetoConhecimento || "",
      skill.keywords.join(" "),
    ].join(" "),
  );
  const keywordSet = new Set(skill.keywords.map(normalizeText));
  const objetoConhecimento = normalizeText(skill.objetoConhecimento || "");

  let score = 0;
  let matchedTerms = 0;
  let specificMatches = 0;
  let objetoMatches = 0;

  for (const term of terms) {
    let termMatched = false;

    if (objetoConhecimento.includes(term)) {
      score += 10;
      objetoMatches += 1;
      termMatched = true;
      specificMatches += 1;
    } else if (normalizeText(skill.unidadeTematica || "").includes(term)) {
      score += 4;
      termMatched = true;
      specificMatches += 1;
    } else if (keywordSet.has(term)) {
      score += 4;
      termMatched = true;
      if (!GENERIC_MATCH_TERMS.has(term)) {
        specificMatches += 1;
      }
    } else if (searchableText.includes(term)) {
      score += 5;
      termMatched = true;
      if (!GENERIC_MATCH_TERMS.has(term)) {
        specificMatches += 1;
      }
    }

    if (termMatched) {
      matchedTerms += 1;
    }
  }

  if (objetoMatches >= 2) {
    score += 4;
  } else if (objetoMatches === 1) {
    score += 2;
  }

  if (matchedTerms > 0 && specificMatches === 0) {
    score -= 6;
  }

  if (options?.usedCodes?.has(skill.codigo)) {
    score -= 40;
  }

  if (options?.assertiveMode) {
    const retrieved = retrieveBnccCandidates([skill], {
      etapa: request.etapa,
      anoSerie: request.anoSerie,
      componenteCurricular: request.componenteCurricular,
    }, content, 1);

    if (retrieved.length > 0) {
      score = Math.max(score, retrieved[0].score);
    }
  }

  return score;
}

export function filterBnccSkillsByContext(
  skills: BNCCSkill[],
  context: BnccContextFilter,
): BNCCSkill[] {
  const etapa = context.etapa || "";
  const anoSerie = context.anoSerie || "";
  const componenteCurricular = context.componenteCurricular || "";
  const stage = etapa ? normalizeStage(etapa, "") : "unknown";

  const stageAndGradeFiltered = skills.filter((skill) => {
    if (etapa && !stageMatches(skill, etapa)) {
      return false;
    }

    if (anoSerie && !gradeMatches(skill, anoSerie)) {
      return false;
    }

    if (stage === "ensino_fundamental" && !skill.codigo.startsWith("EF")) {
      return false;
    }

    if (stage === "ensino_medio" && !skill.codigo.startsWith("EM")) {
      return false;
    }

    if (stage === "educacao_infantil" && !skill.codigo.startsWith("EI")) {
      return false;
    }

    return true;
  });

  if (!componenteCurricular.trim()) {
    return stageAndGradeFiltered;
  }

  const aliases = resolveBnccCatalogSubjects(componenteCurricular).map(normalizeText);
  const catalogHasComponent = stageAndGradeFiltered.some((skill) => {
    const component = normalizeText(skill.componente || "");
    return component && componentAliasMatches(aliases, component, "", true);
  });

  return stageAndGradeFiltered.filter((skill) => {
    if (!catalogHasComponent) {
      return componentMatches(skill, componenteCurricular);
    }

    const component = normalizeText(skill.componente || "");
    if (!component) {
      return componentMatches(skill, componenteCurricular);
    }

    return componentAliasMatches(aliases, component, "", true);
  });
}

export function rankBNCCSkills(
  skills: BNCCSkill[],
  request: BNCCSuggestionRequest,
  options?: { usedCodes?: Set<string>; contentIndex?: number },
): BNCCSkill[] {
  return [...skills]
    .map((skill) => ({
      skill,
      score: calculateTextualRelevance(skill, request, options),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return a.skill.codigo.localeCompare(b.skill.codigo);
    })
    .map((item) => item.skill);
}

export function rankBnccSkillsForContent(
  skills: BNCCSkill[],
  context: BnccContextFilter,
  content: string,
  options?: {
    usedCodes?: Set<string>;
    contentIndex?: number;
    limit?: number;
    excludeCodigos?: Set<string>;
    requireContentMatch?: boolean;
    assertiveMode?: boolean;
  },
): Array<{ skill: BNCCSkill; score: number }> {
  const limit = Math.min(Math.max(options?.limit ?? 3, 1), 5);
  const request: BNCCSuggestionRequest = {
    etapa: context.etapa,
    anoSerie: context.anoSerie,
    componenteCurricular: context.componenteCurricular,
    conteudo: content,
  };

  const exclude = options?.excludeCodigos;
  const pool =
    exclude && exclude.size > 0
      ? skills.filter((skill) => !exclude.has(skill.codigo.toUpperCase()))
      : skills;

  if (options?.assertiveMode) {
    const retrieved = retrieveBnccCandidates(pool, context, content, 15);
    const minScore = options.requireContentMatch
      ? MIN_SUGGESTION_RELEVANCE_SCORE
      : RESCUE_SUGGESTION_RELEVANCE_SCORE;

    return retrieved
      .filter((item) => !options.usedCodes?.has(item.skill.codigo))
      .filter((item) => item.score >= minScore)
      .slice(0, limit)
      .map((item) => ({ skill: item.skill, score: item.score }));
  }

  const ranked = [...pool]
    .map((skill) => ({
      skill,
      score: calculateTextualRelevance(skill, request, options),
    }))
    .filter((item) => item.score >= MIN_SUGGESTION_RELEVANCE_SCORE)
    .sort((a, b) => b.score - a.score || a.skill.codigo.localeCompare(b.skill.codigo));

  return ranked.slice(0, limit);
}

export async function searchBNCCSkills(
  request: BNCCSuggestionRequest,
): Promise<BNCCSuggestionResponse> {
  const installed = await hasInstalledBNCCBase();

  if (!installed) {
    return {
      success: true,
      message: BNCC_NOT_INSTALLED_MESSAGE,
      habilidades: [],
      total: 0,
      baseInstalada: false,
    };
  }

  const etapa = request.etapa || "";
  const anoSerie = request.anoSerie || "";
  const componenteCurricular = request.componenteCurricular || "";
  const conteudo = request.conteudo || "";
  const limite = Math.min(Math.max(Number(request.limite || 3), 1), 3);

  if (!conteudo.trim()) {
    return {
      success: true,
      message: "Informe um conteúdo para buscar habilidades BNCC.",
      habilidades: [],
      total: 0,
      baseInstalada: true,
    };
  }

  const skills = await readBNCCSkills();

  const filtered = filterBnccSkillsByContext(skills, {
    etapa,
    anoSerie,
    componenteCurricular,
  });

  const ranked = rankBNCCSkills(filtered, {
    etapa,
    anoSerie,
    componenteCurricular,
    conteudo,
    limite,
  }).slice(0, limite);

  return {
    success: true,
    message:
      ranked.length > 0
        ? "Habilidades BNCC encontradas na base oficial processada."
        : "Nenhuma habilidade BNCC correspondente foi encontrada na base oficial processada.",
    habilidades: ranked,
    total: ranked.length,
    baseInstalada: true,
  };
}
