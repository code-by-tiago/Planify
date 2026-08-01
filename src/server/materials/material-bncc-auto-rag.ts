/**
 * BNCC RAG dinâmico — auto-fetch de habilidades oficiais quando o payload não traz skills.
 * Usado apenas no motor de materiais (não em planejamento anual/trimestral).
 */

import {
  suggestBnccByConteudos,
  type BnccSkillSuggestion,
} from "@/server/bncc/bncc-suggestion-engine";
import type { MaterialEngineInput } from "./material-engine-types";

const MAX_AUTO_SKILLS = 3;

function hasExplicitSkills(input: MaterialEngineInput): boolean {
  const selected = input.habilidadesSelecionadas;
  if (Array.isArray(selected) && selected.length > 0) return true;
  const bncc = input.habilidadesBncc;
  if (Array.isArray(bncc) && bncc.length > 0) return true;
  return false;
}

function pushSkill(
  rows: Array<{ codigo: string; descricao: string; conteudo?: string }>,
  seen: Set<string>,
  skill: Pick<BnccSkillSuggestion, "codigo" | "descricao" | "conteudo">,
) {
  const codigo = String(skill.codigo || "").trim().toUpperCase();
  const descricao = String(skill.descricao || "").trim();
  if (!codigo || !descricao || seen.has(codigo)) return;
  seen.add(codigo);
  rows.push({
    codigo,
    descricao,
    conteudo: skill.conteudo ? String(skill.conteudo).trim() : undefined,
  });
}

/**
 * Se o professor não selecionou BNCC, busca habilidades oficiais pelo tema/conteúdo
 * e injeta no payload para a âncora RAG do promptEngine.
 */
export async function enrichInputWithAutoBnccRag(
  input: MaterialEngineInput,
): Promise<MaterialEngineInput> {
  if (hasExplicitSkills(input)) {
    return input;
  }

  const tema = String(input.tema || input.temaCentral || "").trim();
  const conteudo = String(input.conteudo || "").trim();
  const seed = [tema, conteudo].filter(Boolean).join("\n").slice(0, 400);
  if (!seed) {
    return input;
  }

  try {
    const suggestion = await suggestBnccByConteudos({
      etapa: input.etapa,
      anoSerie: input.anoSerie,
      componenteCurricular: input.componenteCurricular || input.componente,
      componente: input.componenteCurricular || input.componente,
      areaConhecimento: input.areaConhecimento,
      conteudos: [tema || conteudo].filter(Boolean),
      tema,
      temaCentral: input.temaCentral || tema,
      assertiveMode: false,
    });

    const rows: Array<{ codigo: string; descricao: string; conteudo?: string }> =
      [];
    const seen = new Set<string>();

    for (const group of suggestion.conteudos ?? []) {
      for (const skill of group.habilidades ?? []) {
        pushSkill(rows, seen, skill);
        if (rows.length >= MAX_AUTO_SKILLS) break;
      }
      if (rows.length >= MAX_AUTO_SKILLS) break;
    }

    if (rows.length < MAX_AUTO_SKILLS) {
      for (const skill of suggestion.habilidades ?? []) {
        pushSkill(rows, seen, skill);
        if (rows.length >= MAX_AUTO_SKILLS) break;
      }
    }

    if (!rows.length) {
      return input;
    }

    return {
      ...input,
      habilidadesSelecionadas: rows,
    };
  } catch {
    return input;
  }
}
