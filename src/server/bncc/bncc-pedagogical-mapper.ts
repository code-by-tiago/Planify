import type { BNCCSkill } from "../../types/bncc";
import { resolveBnccCatalogSubjects } from "./discipline-catalog";
import { extractActionVerbs } from "./bncc-retrieval";

export type PedagogicalMappedSkill = {
  codigo: string;
  descricao: string;
  justificativaPedagogica: string;
  relevanceScore: number;
  compatibilidade: "alta" | "compativel" | "resgate";
  etapa?: string;
  anoSerie?: string;
  area?: string;
  componente?: string;
};

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function resolveStagePrefix(etapa?: string, codigo?: string): string {
  const normalized = normalizeText(etapa || "");
  const code = String(codigo || "").toUpperCase();

  if (normalized.includes("infantil") || code.startsWith("EI")) return "EI";
  if (normalized.includes("fundamental") || code.startsWith("EF")) return "EF";
  if (normalized.includes("medio") || code.startsWith("EM")) return "EM";
  return "";
}

function resolveCompatibilidade(score: number): PedagogicalMappedSkill["compatibilidade"] {
  if (score >= 16) return "alta";
  if (score >= 8) return "compativel";
  return "resgate";
}

function extractMatchedVerbs(content: string, skill: BNCCSkill): string[] {
  const contentVerbs = extractActionVerbs(content);
  const skillVerbs = extractActionVerbs(skill.descricao);

  return contentVerbs.filter((verb) => skillVerbs.includes(verb));
}

export function buildJustificativaPedagogica(
  content: string,
  skill: BNCCSkill,
  score: number,
  context: {
    etapa?: string;
    anoSerie?: string;
    componenteCurricular?: string;
  },
): string {
  const matchedVerbs = extractMatchedVerbs(content, skill);
  const stagePrefix = resolveStagePrefix(context.etapa, skill.codigo);
  const componente = context.componenteCurricular || skill.componente || "componente informado";
  const anoSerie = context.anoSerie || skill.ano || skill.serie || "série informada";

  const verbPart =
    matchedVerbs.length > 0
      ? `O verbo de ação "${matchedVerbs[0]}" do conteúdo dialoga com a habilidade.`
      : "O conteúdo informado articula-se com o objeto de conhecimento da habilidade.";

  const objetoPart = skill.objetoConhecimento
    ? ` Objeto de conhecimento: ${skill.objetoConhecimento}.`
    : skill.unidadeTematica
      ? ` Unidade temática: ${skill.unidadeTematica}.`
      : "";

  const compat = resolveCompatibilidade(score);

  return [
    `${skill.codigo} (${stagePrefix || "BNCC"}) é coerente com "${content.trim()}" em ${componente}, ${anoSerie}.`,
    verbPart,
    objetoPart,
    compat === "alta"
      ? "Alta compatibilidade entre termos específicos do conteúdo e a descrição oficial."
      : compat === "compativel"
        ? "Compatibilidade confirmada por termos pedagógicos compartilhados."
        : "Sugestão de resgate com correspondência parcial — revise antes de adotar.",
  ]
    .filter(Boolean)
    .join(" ");
}

export function mapSkillPedagogically(
  content: string,
  skill: BNCCSkill,
  score: number,
  context: {
    etapa?: string;
    anoSerie?: string;
    componenteCurricular?: string;
  },
): PedagogicalMappedSkill | null {
  const stagePrefix = resolveStagePrefix(context.etapa, skill.codigo);
  const codePrefix = skill.codigo.slice(0, 2).toUpperCase();

  if (stagePrefix && !skill.codigo.toUpperCase().startsWith(stagePrefix)) {
    return null;
  }

  const catalogSubjects = resolveBnccCatalogSubjects(context.componenteCurricular || "");
  const skillComponent = normalizeText(skill.componente || skill.areaConhecimento || "");

  if (catalogSubjects.length > 0 && skillComponent) {
    const matches = catalogSubjects.some((subject) =>
      skillComponent.includes(normalizeText(subject)),
    );

    if (!matches && codePrefix === "EF" && normalizeText(context.componenteCurricular || "").includes("portugues")) {
      if (!/^EF\d\dLP/.test(skill.codigo.toUpperCase()) && !/^EM13LP/.test(skill.codigo.toUpperCase())) {
        return null;
      }
    } else if (!matches && codePrefix === "EM") {
      const requested = normalizeText(context.componenteCurricular || "");
      const isLp = requested.includes("portugues") || requested.includes("redacao");
      const isLgg = skill.codigo.includes("LGG");

      if (isLp && !skill.codigo.includes("LP") && !isLgg) {
        return null;
      }
    } else if (!matches) {
      return null;
    }
  }

  return {
    codigo: skill.codigo,
    descricao: skill.descricao,
    justificativaPedagogica: buildJustificativaPedagogica(content, skill, score, context),
    relevanceScore: score,
    compatibilidade: resolveCompatibilidade(score),
    etapa: skill.etapa,
    anoSerie: skill.ano || skill.serie,
    area: skill.areaConhecimento,
    componente: skill.componente,
  };
}

export function mapRetrievedSkills(
  content: string,
  candidates: Array<{ skill: BNCCSkill; score: number }>,
  context: {
    etapa?: string;
    anoSerie?: string;
    componenteCurricular?: string;
  },
): PedagogicalMappedSkill[] {
  const mapped: PedagogicalMappedSkill[] = [];

  for (const candidate of candidates) {
    const item = mapSkillPedagogically(content, candidate.skill, candidate.score, context);

    if (item) {
      mapped.push(item);
    }
  }

  return mapped;
}
