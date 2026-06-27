import type { BNCCSkill } from "../../types/bncc";
import type { BnccSkillSuggestion } from "./bncc-suggestion-engine";
import {
  filterBnccSkillsByContext,
  readBNCCSkills,
  type BnccContextFilter,
} from "./bncc-service";
import { mapRetrievedSkills } from "./bncc-pedagogical-mapper";
import { rankAllBnccCandidates } from "./bncc-retrieval";
import {
  rerankBnccCandidates,
  shouldRerankBnccCandidates,
} from "./bncc-suggestion-rerank";
import { isVagueAssertiveContent, assessAssertiveSkillCoherence } from "./bncc-suggestion-quality";

const RECOMMENDED_LIMIT = 10;

export type BnccPlanningCatalogMeta = {
  total: number;
  catalogTotal: number;
  recommendedTotal: number;
  componente: string;
  etapa: string;
  anoSerie: string;
};

export type BnccPlanningCatalogResult = {
  catalogo: BnccSkillSuggestion[];
  recomendadas: BnccSkillSuggestion[];
  meta: BnccPlanningCatalogMeta;
};

function normalizeSearch(value: unknown): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[_/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isHighSchoolContext(context: BnccContextFilter): boolean {
  const value = normalizeSearch([context.etapa, context.anoSerie].join(" "));

  return (
    value.includes("ensino medio") ||
    value.includes("medio") ||
    value.includes("1 serie") ||
    value.includes("1a serie") ||
    value.includes("2 serie") ||
    value.includes("2a serie") ||
    value.includes("3 serie") ||
    value.includes("3a serie")
  );
}

function expandAssertiveSkillPool(
  filtered: BNCCSkill[],
  catalog: BNCCSkill[],
  context: BnccContextFilter,
  content: string,
): BNCCSkill[] {
  const componente = normalizeSearch(context.componenteCurricular || "");
  const normalizedContent = normalizeSearch(content);
  const pool = new Map(filtered.map((skill) => [skill.codigo.toUpperCase(), skill]));

  const includeLggForLpEm =
    isHighSchoolContext(context) &&
    (componente.includes("lingua portuguesa") ||
      componente.includes("redacao") ||
      componente.includes("escrita criativa")) &&
    /verbal|nao verbal|naoverbal|mista|semios|gestual|paralingu|multimodal|linguagens/.test(
      normalizedContent,
    );

  if (includeLggForLpEm) {
    for (const skill of catalog) {
      const code = skill.codigo.toUpperCase();

      if (/^EM13LGG/.test(code)) {
        pool.set(code, skill);
      }
    }
  }

  return Array.from(pool.values());
}

function toBnccSkillSuggestion(
  item: {
    codigo: string;
    descricao: string;
    relevanceScore: number;
    justificativaPedagogica: string;
    compatibilidade: "alta" | "compativel" | "resgate";
    etapa?: string;
    anoSerie?: string;
    area?: string;
    componente?: string;
  },
  skill: BNCCSkill,
  conteudo: string,
  index: number,
): BnccSkillSuggestion {
  return {
    id: `${item.codigo}-${normalizeSearch(conteudo).slice(0, 28)}-${index}`,
    codigo: item.codigo,
    descricao: item.descricao,
    texto: `${item.codigo} — ${item.descricao}`,
    label: `${item.codigo} — ${item.descricao}`,
    etapa: item.etapa || skill.etapa,
    anoSerie: item.anoSerie,
    area: item.area,
    componente: item.componente,
    conteudo,
    score: item.relevanceScore,
    relevanceScore: item.relevanceScore,
    justificativaPedagogica: item.justificativaPedagogica,
    compatibilidade: item.compatibilidade,
    source: "local",
  };
}

function buildCatalogSuggestions(
  conteudo: string,
  retrieved: Array<{
    skill: BNCCSkill;
    score: number;
    stemMatches: number;
    specificMatches: number;
  }>,
  context: BnccContextFilter,
): BnccSkillSuggestion[] {
  const mapped = mapRetrievedSkills(
    conteudo,
    retrieved.map((item) => ({ skill: item.skill, score: item.score })),
    context,
  );

  const mappedByCode = new Map(mapped.map((item) => [item.codigo.toUpperCase(), item]));

  return retrieved
    .filter((item) => mappedByCode.has(item.skill.codigo.toUpperCase()))
    .map((item, index) => {
      const mappedItem = mappedByCode.get(item.skill.codigo.toUpperCase())!;

      return toBnccSkillSuggestion(mappedItem, item.skill, conteudo, index);
    });
}

function pickRecommended(
  catalogo: BnccSkillSuggestion[],
  retrieved: Array<{ skill: BNCCSkill; stemMatches: number }>,
  excludeCodigos: Set<string>,
): BnccSkillSuggestion[] {
  const stemByCode = new Map(
    retrieved.map((item) => [item.skill.codigo.toUpperCase(), item.stemMatches]),
  );

  const available = catalogo.filter(
    (item) => !excludeCodigos.has(item.codigo.toUpperCase()),
  );

  const withStem = available.filter(
    (item) => (stemByCode.get(item.codigo.toUpperCase()) ?? 0) > 0,
  );

  const pool = withStem.length > 0 ? withStem : available;

  return pool.slice(0, RECOMMENDED_LIMIT);
}

export async function listBnccCatalogForPlanning({
  context,
  conteudo,
  excludeCodigos = [],
  catalog: preloadedCatalog,
}: {
  context: BnccContextFilter;
  conteudo: string;
  excludeCodigos?: string[];
  catalog?: BNCCSkill[];
}): Promise<BnccPlanningCatalogResult> {
  const emptyMeta: BnccPlanningCatalogMeta = {
    total: 0,
    catalogTotal: 0,
    recommendedTotal: 0,
    componente: context.componenteCurricular || "",
    etapa: context.etapa || "",
    anoSerie: context.anoSerie || "",
  };

  if (isVagueAssertiveContent(conteudo)) {
    return { catalogo: [], recomendadas: [], meta: emptyMeta };
  }

  const catalog = preloadedCatalog ?? (await readBNCCSkills());
  const filtered = filterBnccSkillsByContext(catalog, context);
  const pool = expandAssertiveSkillPool(filtered, catalog, context, conteudo);
  const exclude = new Set(excludeCodigos.map((code) => code.toUpperCase()));

  let retrieved = rankAllBnccCandidates(pool, context, conteudo);

  if (shouldRerankBnccCandidates(retrieved.filter((item) => item.score > 0).slice(0, 15))) {
    const topForRerank = retrieved.filter((item) => item.score > 0).slice(0, 15);
    const reranked = await rerankBnccCandidates({
      content: conteudo,
      context,
      candidates: topForRerank,
    });

    const rerankedCodes = new Set(reranked.map((item) => item.skill.codigo.toUpperCase()));
    const tail = retrieved.filter((item) => !rerankedCodes.has(item.skill.codigo.toUpperCase()));
    retrieved = [
      ...reranked.map((item, index) => ({
        skill: item.skill,
        score: item.score,
        stemMatches: topForRerank[index]?.stemMatches ?? 0,
        specificMatches: topForRerank[index]?.specificMatches ?? 0,
      })),
      ...tail,
    ];
  }

  const catalogo = buildCatalogSuggestions(conteudo, retrieved, context);
  const coherentCatalog = catalogo.filter(
    (skill) => assessAssertiveSkillCoherence(conteudo, skill, skill.score).coherent,
  );
  const recomendadas = pickRecommended(
    coherentCatalog.length > 0 ? coherentCatalog : catalogo,
    retrieved,
    exclude,
  );

  return {
    catalogo,
    recomendadas,
    meta: {
      total: catalogo.length,
      catalogTotal: catalogo.length,
      recommendedTotal: recomendadas.length,
      componente: context.componenteCurricular || "",
      etapa: context.etapa || "",
      anoSerie: context.anoSerie || "",
    },
  };
}
