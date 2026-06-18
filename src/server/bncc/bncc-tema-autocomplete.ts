import "server-only";

import type { BNCCSkill } from "@/types/bncc";
import { expandContentTerms } from "./bncc-term-expansion";
import {
  calculateTextualRelevance,
  filterBnccSkillsByContext,
  readBNCCSkills,
} from "./bncc-service";

export type BnccTemaAutocompleteSkill = {
  id: string;
  codigo: string;
  descricao: string;
  etapa?: string;
  anoSerie?: string;
  area?: string;
  componente?: string;
  conteudo: string;
};

export type BnccTemaAutocompleteSuggestion = {
  id: string;
  label: string;
  tema: string;
  unidadeTematica?: string;
  objetoConhecimento?: string;
  componente?: string;
  habilidades: BnccTemaAutocompleteSkill[];
  score: number;
};

type SearchContext = {
  etapa?: string;
  anoSerie?: string;
  componente?: string;
};

const KEYWORD_LABELS: Record<string, string> = {
  fracoes: "Frações",
  fracao: "Fração",
  representar: "Representação",
  representacao: "Representação",
  numeros: "Números",
  numero: "Número",
  geometria: "Geometria",
  algebra: "Álgebra",
  ecossistema: "Ecossistema",
  ecossistemas: "Ecossistemas",
  celula: "Célula",
  celulas: "Células",
  energia: "Energia",
  materia: "Matéria",
  verbos: "Verbos",
  texto: "Texto",
  textos: "Textos",
  leitura: "Leitura",
  escrita: "Escrita",
  historia: "História",
  geografia: "Geografia",
  civica: "Cidadania",
};

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatKeywordLabel(keyword: string): string {
  const normalized = normalizeText(keyword);
  if (KEYWORD_LABELS[normalized]) {
    return KEYWORD_LABELS[normalized];
  }

  return keyword.charAt(0).toUpperCase() + keyword.slice(1);
}

function stageLabel(skill: BNCCSkill): string | undefined {
  if (skill.etapa === "ensino_fundamental") return "Ensino Fundamental";
  if (skill.etapa === "ensino_medio") return "Ensino Médio";
  if (skill.etapa === "educacao_infantil") return "Educação Infantil";
  return undefined;
}

function skillToAutocompleteSkill(
  skill: BNCCSkill,
  conteudo: string,
): BnccTemaAutocompleteSkill {
  return {
    id: skill.id || skill.codigo,
    codigo: skill.codigo,
    descricao: skill.descricao,
    etapa: stageLabel(skill),
    anoSerie: skill.ano || skill.serie,
    area: skill.areaConhecimento,
    componente: skill.componente,
    conteudo,
  };
}

function deriveTopicParts(
  skill: BNCCSkill,
  queryTerms: string[],
): { primary: string; secondary?: string } {
  const unit = skill.unidadeTematica?.trim();
  const object = skill.objetoConhecimento?.trim();

  if (unit) {
    return {
      primary: unit,
      secondary: object || undefined,
    };
  }

  if (object) {
    return { primary: object };
  }

  const matchingKeywords = skill.keywords
    .map((keyword) => normalizeText(keyword))
    .filter(
      (keyword) =>
        keyword.length >= 4 &&
        queryTerms.some(
          (term) => keyword.includes(term) || term.includes(keyword),
        ),
    );

  if (matchingKeywords.length > 0) {
    const primary = formatKeywordLabel(matchingKeywords[0]);
    const secondary = matchingKeywords[1]
      ? formatKeywordLabel(matchingKeywords[1])
      : undefined;

    return { primary, secondary };
  }

  const searchable = normalizeText(skill.descricao);
  const matchedTerm = queryTerms.find((term) => searchable.includes(term));

  if (matchedTerm) {
    return { primary: formatKeywordLabel(matchedTerm) };
  }

  const fallback = skill.componente?.trim() || "Tema BNCC";
  return { primary: fallback };
}

function formatSuggestionLabel(
  primary: string,
  secondary: string | undefined,
  componente: string | undefined,
): string {
  const topic = secondary ? `${primary}: ${secondary}` : primary;
  return componente ? `${topic} (${componente})` : topic;
}

function buildGroupKey(
  primary: string,
  secondary: string | undefined,
  componente: string | undefined,
): string {
  return [normalizeText(primary), normalizeText(secondary || ""), normalizeText(componente || "")]
    .filter(Boolean)
    .join("::");
}

function mapSuggestionGroups(
  groups: Map<
    string,
    {
      primary: string;
      secondary?: string;
      componente?: string;
      score: number;
      skills: BNCCSkill[];
    }
  >,
  context: SearchContext,
  limit: number,
): BnccTemaAutocompleteSuggestion[] {
  return Array.from(groups.values())
    .sort(
      (a, b) =>
        b.score - a.score || a.primary.localeCompare(b.primary, "pt-BR"),
    )
    .slice(0, limit)
    .map((group) => {
      const tema = group.secondary
        ? `${group.primary}: ${group.secondary}`
        : group.primary;
      const label = formatSuggestionLabel(
        group.primary,
        group.secondary,
        group.componente,
      );

      return {
        id: buildGroupKey(group.primary, group.secondary, group.componente),
        label,
        tema,
        unidadeTematica: group.primary,
        objetoConhecimento: group.secondary,
        componente: group.componente,
        score: group.score,
        habilidades: group.skills
          .slice(0, 3)
          .map((skill) => skillToAutocompleteSkill(skill, tema)),
      };
    });
}

/** Temas BNCC frequentes no contexto — prefetch ao focar o campo (lista/prova). */
export async function browseBnccTemaSuggestions(
  context: SearchContext = {},
  limit = 8,
): Promise<BnccTemaAutocompleteSuggestion[]> {
  const catalog = await readBNCCSkills();
  const filtered = filterBnccSkillsByContext(catalog, {
    etapa: context.etapa,
    anoSerie: context.anoSerie,
    componenteCurricular: context.componente,
  });

  const groups = new Map<
    string,
    {
      primary: string;
      secondary?: string;
      componente?: string;
      score: number;
      skills: BNCCSkill[];
    }
  >();

  for (const skill of filtered) {
    const { primary, secondary } = deriveTopicParts(skill, []);
    const componente = skill.componente?.trim() || context.componente?.trim();
    const key = buildGroupKey(primary, secondary, componente);
    const current = groups.get(key);

    if (!current) {
      groups.set(key, {
        primary,
        secondary,
        componente,
        score: 1,
        skills: [skill],
      });
      continue;
    }

    current.score += 1;

    if (!current.skills.some((item) => item.codigo === skill.codigo)) {
      current.skills.push(skill);
    }
  }

  return mapSuggestionGroups(groups, context, limit);
}

export async function searchBnccTemaSuggestions(
  query: string,
  context: SearchContext = {},
  limit = 8,
): Promise<BnccTemaAutocompleteSuggestion[]> {
  const trimmedQuery = query.trim();

  if (trimmedQuery.length < 2) {
    return [];
  }

  const queryTerms = expandContentTerms(trimmedQuery);
  const catalog = await readBNCCSkills();
  const filtered = filterBnccSkillsByContext(catalog, {
    etapa: context.etapa,
    anoSerie: context.anoSerie,
    componenteCurricular: context.componente,
  });

  const ranked = filtered
    .map((skill) => ({
      skill,
      score: calculateTextualRelevance(skill, { conteudo: trimmedQuery }),
    }))
    .filter((item) => item.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score || a.skill.codigo.localeCompare(b.skill.codigo),
    )
    .slice(0, 80);

  const groups = new Map<
    string,
    {
      primary: string;
      secondary?: string;
      componente?: string;
      score: number;
      skills: BNCCSkill[];
    }
  >();

  for (const { skill, score } of ranked) {
    const { primary, secondary } = deriveTopicParts(skill, queryTerms);
    const componente = skill.componente?.trim() || context.componente?.trim();
    const key = buildGroupKey(primary, secondary, componente);
    const current = groups.get(key);

    if (!current) {
      groups.set(key, {
        primary,
        secondary,
        componente,
        score,
        skills: [skill],
      });
      continue;
    }

    current.score = Math.max(current.score, score);

    if (!current.skills.some((item) => item.codigo === skill.codigo)) {
      current.skills.push(skill);
    }
  }

  return mapSuggestionGroups(groups, context, limit);
}
