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

function normalizeGrade(value: string): string {
  return normalizeText(value)
    .replace("serie", "")
    .replace("ano", "")
    .replace(/\s+/g, " ")
    .trim();
}

function gradeMatches(skill: BNCCSkill, requestedGrade: string): boolean {
  if (!requestedGrade) {
    return true;
  }

  const requested = normalizeGrade(requestedGrade);
  const skillGrade = normalizeGrade(skill.ano || skill.serie || "");

  if (!skillGrade) {
    return true;
  }

  if (skillGrade === requested) {
    return true;
  }

  const requestedNumber = requested.match(/\d+/)?.[0];
  const skillNumber = skillGrade.match(/\d+/)?.[0];

  return Boolean(requestedNumber && skillNumber && requestedNumber === skillNumber);
}

function componentMatches(skill: BNCCSkill, requestedComponent: string): boolean {
  if (!requestedComponent) {
    return true;
  }

  const requested = normalizeText(requestedComponent);
  const component = normalizeText(skill.componente || "");
  const area = normalizeText(skill.areaConhecimento || "");

  if (!component && !area) {
    return true;
  }

  return component.includes(requested) || requested.includes(component) || area.includes(requested);
}

function stageMatches(skill: BNCCSkill, requestedStage: string): boolean {
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

function calculateTextualRelevance(skill: BNCCSkill, request: BNCCSuggestionRequest): number {
  const content = request.conteudo || "";
  const tokens = tokenize(content);

  if (tokens.length === 0) {
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

  let score = 0;

  for (const token of tokens) {
    if (searchableText.includes(token)) {
      score += 3;
    }

    if (skill.keywords.includes(token)) {
      score += 2;
    }

    if (normalizeText(skill.objetoConhecimento || "").includes(token)) {
      score += 3;
    }

    if (normalizeText(skill.unidadeTematica || "").includes(token)) {
      score += 2;
    }
  }

  if (request.componenteCurricular && componentMatches(skill, request.componenteCurricular)) {
    score += 4;
  }

  if (request.anoSerie && gradeMatches(skill, request.anoSerie)) {
    score += 2;
  }

  if (request.etapa && stageMatches(skill, request.etapa)) {
    score += 2;
  }

  return score;
}

export function rankBNCCSkills(skills: BNCCSkill[], request: BNCCSuggestionRequest): BNCCSkill[] {
  return [...skills]
    .map((skill) => ({
      skill,
      score: calculateTextualRelevance(skill, request),
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

  const filtered = skills.filter((skill) => {
    if (!stageMatches(skill, etapa)) {
      return false;
    }

    if (!gradeMatches(skill, anoSerie)) {
      return false;
    }

    if (!componentMatches(skill, componenteCurricular)) {
      return false;
    }

    if (etapa && normalizeStage(etapa, "") === "ensino_fundamental" && !skill.codigo.startsWith("EF")) {
      return false;
    }

    if (etapa && normalizeStage(etapa, "") === "ensino_medio" && !skill.codigo.startsWith("EM")) {
      return false;
    }

    return true;
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
