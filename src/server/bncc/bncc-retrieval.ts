import type { BNCCSkill } from "../../types/bncc";
import type { BnccContextFilter } from "./bncc-service";
import { expandContentTerms } from "./bncc-term-expansion";

const GENERIC_TERMS = new Set([
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
  "sociedade",
  "cultura",
  "historia",
  "numeros",
  "numero",
  "estudar",
  "analise",
  "compreensao",
]);

const ACTION_VERBS = [
  "analisar",
  "avaliar",
  "compreender",
  "identificar",
  "comparar",
  "classificar",
  "elaborar",
  "produzir",
  "resolver",
  "investigar",
  "relacionar",
  "interpretar",
  "reconhecer",
  "explicar",
  "descrever",
  "estabelecer",
  "utilizar",
  "aplicar",
  "argumentar",
  "debater",
  "selecionar",
  "organizar",
  "representar",
  "calcular",
  "medir",
  "observar",
  "experimentar",
  "formular",
  "demonstrar",
  "construir",
  "avaliar",
  "refletir",
  "participar",
  "explorar",
  "localizar",
  "registrar",
  "relatar",
  "inferir",
  "sintetizar",
  "validar",
  "verificar",
  "propor",
  "defender",
  "caracterizar",
  "contextualizar",
  "relacionar",
  "fazer",
  "usar",
];

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const PT_SUFFIXES = [
  "mente",
  "acao",
  "icao",
  "idade",
  "ismo",
  "ista",
  "avel",
  "ivel",
  "ando",
  "endo",
  "indo",
  "ados",
  "adas",
  "idos",
  "idas",
  "oes",
  "aes",
  "ais",
  "eis",
  "oes",
  "ar",
  "er",
  "ir",
  "or",
  "am",
  "em",
  "im",
  "os",
  "as",
  "es",
  "is",
  "ao",
  "co",
  "ca",
  "to",
  "ta",
  "te",
  "do",
  "da",
  "de",
  "s",
];

export function stemPt(term: string): string {
  const normalized = normalizeText(term);

  if (normalized.length <= 4) {
    return normalized;
  }

  let stem = normalized;

  for (const suffix of PT_SUFFIXES) {
    if (stem.length - suffix.length >= 4 && stem.endsWith(suffix)) {
      stem = stem.slice(0, -suffix.length);
      break;
    }
  }

  return stem;
}

export function termsMatch(contentTerm: string, candidateText: string): boolean {
  const normalizedCandidate = normalizeText(candidateText);
  const stem = stemPt(contentTerm);

  if (!stem || stem.length < 3) {
    return false;
  }

  if (normalizedCandidate.includes(contentTerm)) {
    return true;
  }

  if (normalizedCandidate.includes(stem)) {
    return true;
  }

  const candidateTokens = normalizedCandidate.split(" ").filter(Boolean);

  for (const token of candidateTokens) {
    if (token.startsWith(stem) || stem.startsWith(token)) {
      return true;
    }
  }

  return false;
}

export function extractActionVerbs(text: string): string[] {
  const normalized = normalizeText(text);
  const found = new Set<string>();

  for (const verb of ACTION_VERBS) {
    if (normalized.includes(verb)) {
      found.add(verb);
    }
  }

  return Array.from(found);
}

export type BnccRetrievalCandidate = {
  skill: BNCCSkill;
  score: number;
  stemMatches: number;
  specificMatches: number;
};

export function rankAllBnccCandidates(
  catalog: BNCCSkill[],
  context: BnccContextFilter,
  content: string,
): BnccRetrievalCandidate[] {
  const terms = expandContentTerms(content, { assertiveMode: true });
  const contentVerbs = extractActionVerbs(content);

  const ranked = catalog.map((skill) => {
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
    const objetoConhecimento = normalizeText(skill.objetoConhecimento || "");
    const unidadeTematica = normalizeText(skill.unidadeTematica || "");
    const skillVerbs = extractActionVerbs(skill.descricao);

    let score = 0;
    let stemMatches = 0;
    let specificMatches = 0;

    for (const term of terms) {
      const isGeneric = GENERIC_TERMS.has(term);

      if (objetoConhecimento && termsMatch(term, objetoConhecimento)) {
        score += 12;
        stemMatches += 1;
        if (!isGeneric) specificMatches += 1;
        continue;
      }

      if (unidadeTematica && termsMatch(term, unidadeTematica)) {
        score += 8;
        stemMatches += 1;
        if (!isGeneric) specificMatches += 1;
        continue;
      }

      if (termsMatch(term, searchableText)) {
        score += isGeneric ? 1 : 6;
        stemMatches += 1;
        if (!isGeneric) specificMatches += 1;
      }
    }

    for (const verb of contentVerbs) {
      if (skillVerbs.includes(verb)) {
        score += 5;
      } else if (searchableText.includes(verb)) {
        score += 2;
      }
    }

    if (specificMatches >= 2) {
      score += 4;
    }

    if (stemMatches > 0 && specificMatches === 0) {
      score -= 4;
    }

    if (context.componenteCurricular) {
      const component = normalizeText(skill.componente || "");
      const requested = normalizeText(context.componenteCurricular);

      if (component && (component.includes(requested) || requested.includes(component))) {
        score += 6;
      }
    }

    return {
      skill,
      score,
      stemMatches,
      specificMatches,
    };
  });

  return ranked.sort(
    (a, b) => b.score - a.score || a.skill.codigo.localeCompare(b.skill.codigo),
  );
}

export function retrieveBnccCandidates(
  catalog: BNCCSkill[],
  context: BnccContextFilter,
  content: string,
  topK = 15,
): BnccRetrievalCandidate[] {
  const terms = expandContentTerms(content, { assertiveMode: true });
  const contentVerbs = extractActionVerbs(content);

  if (terms.length === 0 && contentVerbs.length === 0) {
    return [];
  }

  return rankAllBnccCandidates(catalog, context, content)
    .filter((item) => item.score > 0)
    .slice(0, topK);
}
