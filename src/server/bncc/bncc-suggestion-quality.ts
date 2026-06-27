import type { BnccSkillSuggestion } from "./bncc-suggestion-engine";
import { stemPt } from "./bncc-retrieval";
import { expandContentTerms } from "./bncc-term-expansion";

export const MIN_SUGGESTION_RELEVANCE_SCORE = 8;
export const HIGH_SUGGESTION_RELEVANCE_SCORE = 16;
export const RESCUE_SUGGESTION_RELEVANCE_SCORE = 5;

export type BnccSuggestionGroup = {
  conteudo: string;
  habilidades: BnccSkillSuggestion[];
};

export type BnccSuggestionEngineResult = {
  conteudos?: BnccSuggestionGroup[];
  habilidades?: BnccSkillSuggestion[];
  total?: number;
  message?: string;
  source?: string;
  qualityScore?: number;
  qualityIssues?: string[];
};

export type BnccSuggestionPayloadLike = {
  etapa?: string;
  anoSerie?: string;
  serie?: string;
  componenteCurricular?: string;
  componente?: string;
};

export type SkillCoherenceAssessment = {
  coherent: boolean;
  relevanceScore: number;
  issues: string[];
};

export function assessSkillContentCoherence(
  content: string,
  skill: Pick<BnccSkillSuggestion, "codigo" | "descricao" | "componente" | "score">,
  score = skill.score,
): SkillCoherenceAssessment {
  const issues: string[] = [];
  const relevanceScore = Number.isFinite(score) ? score : 0;

  if (!content.trim()) {
    issues.push("Conteúdo vazio — não é possível avaliar coerência.");
  }

  if (relevanceScore < MIN_SUGGESTION_RELEVANCE_SCORE) {
    issues.push(
      `Baixa compatibilidade textual (${relevanceScore}) para "${content.slice(0, 60)}".`,
    );
  }

  return {
    coherent: relevanceScore >= MIN_SUGGESTION_RELEVANCE_SCORE,
    relevanceScore,
    issues,
  };
}

const VAGUE_CONTENT_PATTERNS = [
  /aula generica/,
  /conteudo generico/,
  /conteudos genericos/,
  /conteudos diversos/,
  /temas variados/,
  /assuntos diversos/,
  /conteudo variado/,
];

const GENERIC_CONTENT_TERMS = new Set([
  "generica",
  "generico",
  "genericos",
  "diversos",
  "variados",
  "variado",
  "assunto",
  "assuntos",
  "conteudo",
  "conteudos",
  "aula",
  "aulas",
  "tema",
  "temas",
  "sobre",
]);

export function isVagueAssertiveContent(content: string): boolean {
  const normalized = normalizeSearch(content);

  if (VAGUE_CONTENT_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return true;
  }

  const terms = expandContentTerms(content, { assertiveMode: true });
  const specificTerms = terms.filter(
    (term) => term.length >= 5 && !GENERIC_CONTENT_TERMS.has(term),
  );

  return specificTerms.length === 0;
}

function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasSpecificStemMatch(content: string, skill: Pick<BnccSkillSuggestion, "descricao">): boolean {
  const contentTerms = normalizeSearch(content)
    .split(" ")
    .filter((term) => term.length >= 5);
  const skillText = normalizeSearch(`${skill.descricao || ""}`);

  return contentTerms.some((term) => {
    const stem = stemPt(term);
    return stem.length >= 4 && skillText.includes(stem);
  });
}

export function assessAssertiveSkillCoherence(
  content: string,
  skill: Pick<BnccSkillSuggestion, "codigo" | "descricao" | "componente" | "score">,
  score = skill.score,
): SkillCoherenceAssessment {
  const relevanceScore = Number.isFinite(score) ? score : 0;
  const issues: string[] = [];

  if (relevanceScore >= HIGH_SUGGESTION_RELEVANCE_SCORE) {
    return { coherent: true, relevanceScore, issues };
  }

  if (relevanceScore >= MIN_SUGGESTION_RELEVANCE_SCORE) {
    return { coherent: true, relevanceScore, issues };
  }

  if (
    relevanceScore >= RESCUE_SUGGESTION_RELEVANCE_SCORE &&
    hasSpecificStemMatch(content, skill)
  ) {
    return { coherent: true, relevanceScore, issues };
  }

  issues.push(
    `Compatibilidade insuficiente (${relevanceScore}) para "${content.slice(0, 60)}".`,
  );

  return { coherent: false, relevanceScore, issues };
}

export function filterCoherentSuggestions(
  group: BnccSuggestionGroup,
  options?: { assertiveMode?: boolean },
): BnccSuggestionGroup {
  const assess = options?.assertiveMode
    ? assessAssertiveSkillCoherence
    : assessSkillContentCoherence;

  const habilidades = (group.habilidades || []).filter((skill) =>
    assess(group.conteudo, skill, skill.score).coherent,
  );

  return {
    conteudo: group.conteudo,
    habilidades,
  };
}

export function assessBnccSuggestionResult(
  payload: BnccSuggestionPayloadLike,
  result: BnccSuggestionEngineResult,
): { qualityScore: number; qualityIssues: string[] } {
  const groups = result.conteudos || [];
  const componente = String(
    payload.componenteCurricular || payload.componente || "",
  ).trim();
  const issues: string[] = [];
  let totalSkills = 0;
  let coherentSkills = 0;
  let highScoreSkills = 0;

  for (const group of groups) {
    const skills = group.habilidades || [];
    totalSkills += skills.length;

    if (skills.length === 0) {
      issues.push(`Nenhuma habilidade coerente para "${group.conteudo.slice(0, 80)}".`);
      continue;
    }

    if (skills.length < 3) {
      issues.push(
        `Apenas ${skills.length} habilidade(s) coerente(s) para "${group.conteudo.slice(0, 80)}".`,
      );
    }

    for (const skill of skills) {
      const assessment = assessSkillContentCoherence(group.conteudo, skill, skill.score);

      if (assessment.coherent) {
        coherentSkills += 1;
      } else {
        issues.push(`${skill.codigo}: ${assessment.issues[0] || "baixa compatibilidade"}`);
      }

      if (assessment.relevanceScore >= HIGH_SUGGESTION_RELEVANCE_SCORE) {
        highScoreSkills += 1;
      }

      if (componente && skill.componente) {
        const normalizedComponent = componente
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();
        const skillComponent = skill.componente
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();

        if (
          !skillComponent.includes(normalizedComponent) &&
          !normalizedComponent.includes(skillComponent)
        ) {
          issues.push(`${skill.codigo} pode não pertencer ao componente ${componente}.`);
        }
      }
    }
  }

  if (totalSkills === 0) {
    return {
      qualityScore: 0,
      qualityIssues: issues.length > 0 ? issues : ["Nenhuma habilidade sugerida."],
    };
  }

  const coverageRatio = coherentSkills / Math.max(totalSkills, 1);
  const highScoreRatio = highScoreSkills / Math.max(totalSkills, 1);
  const groupCoverage =
    groups.filter((group) => (group.habilidades || []).length > 0).length /
    Math.max(groups.length, 1);

  const qualityScore = Math.round(
    coverageRatio * 45 + highScoreRatio * 35 + groupCoverage * 20,
  );

  return {
    qualityScore: Math.min(100, Math.max(0, qualityScore)),
    qualityIssues: issues.slice(0, 12),
  };
}
