import { computeTextSimilarity, SIMILARITY_THRESHOLD } from "@/lib/planejamentos/planning-trimestral-similarity";
import type { TrimestralAulaPlan } from "@/lib/planejamentos/planning-trimestral-types";

const PLACEHOLDER_PATTERN = /\[(descreva|de acordo|indique|data de)/i;

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export type PedagogicalValidationResult = {
  ok: boolean;
  issues: string[];
};

export function validateTrimestralAulaPlans(aulas: TrimestralAulaPlan[]): PedagogicalValidationResult {
  const issues: string[] = [];

  for (const aula of aulas) {
    const item = aula.itemAnual;
    const activeSemanas = aula.semanas.filter((s) => s.etapas.trim());

    if (activeSemanas.length === 0) {
      issues.push(`Aula ${item.numeroAula}: nenhuma semana ativa.`);
      continue;
    }

    for (const semana of activeSemanas) {
      for (const field of ["metodologia", "materiais", "etapas", "evidencias", "instrumentos"] as const) {
        const value = semana[field].trim();
        if (!value || value.length < 12) {
          issues.push(`Aula ${item.numeroAula} semana ${semana.semana}: campo ${field} vazio ou curto.`);
        }
        if (PLACEHOLDER_PATTERN.test(value)) {
          issues.push(`Aula ${item.numeroAula} semana ${semana.semana}: placeholder em ${field}.`);
        }
      }
    }

    for (let i = 0; i < activeSemanas.length; i += 1) {
      for (let j = i + 1; j < activeSemanas.length; j += 1) {
        for (const field of ["metodologia", "etapas", "evidencias", "instrumentos"] as const) {
          const sim = computeTextSimilarity(activeSemanas[i][field], activeSemanas[j][field]);
          if (sim > SIMILARITY_THRESHOLD) {
            issues.push(
              `Aula ${item.numeroAula}: ${field} semanas ${activeSemanas[i].semana} e ${activeSemanas[j].semana} muito similares.`,
            );
          }
        }
      }
    }
  }

  return { ok: issues.length === 0, issues };
}
