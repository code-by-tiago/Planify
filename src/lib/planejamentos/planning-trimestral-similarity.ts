const SIMILARITY_THRESHOLD = 0.7;
const MAX_REWRITE_ATTEMPTS = 8;

function normalizeForSimilarity(text: string): string {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSet(text: string): Set<string> {
  const normalized = normalizeForSimilarity(text);
  if (!normalized) {
    return new Set();
  }

  return new Set(normalized.split(" ").filter((token) => token.length > 2));
}

/** Índice de similaridade Jaccard entre dois textos (0–1). */
export function computeTextSimilarity(a: string, b: string): number {
  if (!a.trim() || !b.trim()) {
    return 0;
  }

  const setA = tokenSet(a);
  const setB = tokenSet(b);

  if (setA.size === 0 || setB.size === 0) {
    return 0;
  }

  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) {
      intersection += 1;
    }
  }

  const union = setA.size + setB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

const METODOLOGIA_VARIANTS = [
  "Trabalho em grupo",
  "Atividade em duplas",
  "Produção individual",
  "Discussão em plenária",
  "Rodízio de estações",
];

const EVIDENCIA_PREFIXES = ["Observar", "Registrar", "Acompanhar", "Verificar", "Analisar"];

const INSTRUMENTO_VARIANTS = [
  "Registro em ficha de acompanhamento",
  "Lista de exercícios com correção orientada",
  "Rubrica de participação",
  "Autoavaliação com critérios da aula",
  "Portfólio parcial do encontro",
];

type WeekField = "metodologia" | "materiais" | "etapas" | "evidencias" | "instrumentos";

function rewriteField(
  field: WeekField,
  value: string,
  weekIndex: number,
  conteudo: string,
  attempt: number,
): string {
  switch (field) {
    case "metodologia": {
      const org = METODOLOGIA_VARIANTS[(weekIndex + attempt) % METODOLOGIA_VARIANTS.length];
      const base = value.replace(/^[^:]+:\s*/, "").trim() || value;
      return `${org} para ${base} (encontro ${weekIndex + 1}).`;
    }
    case "materiais": {
      const parts = value.split(/[,;]/).map((p) => p.trim()).filter(Boolean);
      const pick = parts[(weekIndex + attempt) % Math.max(parts.length, 1)] || parts[0] || value;
      return `${pick}; recursos da semana ${weekIndex + 1}.`;
    }
    case "etapas":
      return `${weekIndex + 1}. ${value.replace(/^\d+\.\s*/, "").trim()}`;
    case "evidencias": {
      const prefix = EVIDENCIA_PREFIXES[(weekIndex + attempt) % EVIDENCIA_PREFIXES.length];
      const rest = value.charAt(0).toLowerCase() + value.slice(1);
      return `${prefix} ${rest} — foco em ${conteudo} (semana ${weekIndex + 1}).`;
    }
    case "instrumentos": {
      const tool = INSTRUMENTO_VARIANTS[(weekIndex + attempt) % INSTRUMENTO_VARIANTS.length];
      return `${tool} sobre ${conteudo} na semana ${weekIndex + 1}.`;
    }
    default:
      return value;
  }
}

type SemanaFields = {
  metodologia: string;
  materiais: string;
  etapas: string;
  evidencias: string;
  instrumentos: string;
};

export function deduplicateWeekFields<
  T extends { semanas: SemanaFields[]; itemAnual: { conteudo: string } },
>(aulas: T[]): { aulas: T[]; maxSimilaridade: number } {
  let maxSimilaridade = 0;
  const fields: WeekField[] = ["metodologia", "materiais", "etapas", "evidencias", "instrumentos"];

  const result = aulas.map((aula) => ({
    ...aula,
    semanas: aula.semanas.map((semana) => ({ ...semana })),
  }));

  for (let aulaIndex = 0; aulaIndex < result.length; aulaIndex += 1) {
    const aula = result[aulaIndex];
    const conteudo = aula.itemAnual.conteudo;

    for (let weekIndex = 0; weekIndex < aula.semanas.length; weekIndex += 1) {
      const semana = aula.semanas[weekIndex];
      if (!semana.etapas.trim()) {
        continue;
      }

      for (const field of fields) {
        let current = String(semana[field] || "").trim();
        if (!current) {
          continue;
        }

        for (let attempt = 0; attempt < MAX_REWRITE_ATTEMPTS; attempt += 1) {
          let tooSimilar = false;

          for (let otherWeek = 0; otherWeek < aula.semanas.length; otherWeek += 1) {
            if (otherWeek === weekIndex) {
              continue;
            }
            const other = String(aula.semanas[otherWeek][field] || "").trim();
            if (!other) {
              continue;
            }
            const sim = computeTextSimilarity(current, other);
            maxSimilaridade = Math.max(maxSimilaridade, sim);
            if (sim > SIMILARITY_THRESHOLD) {
              tooSimilar = true;
              break;
            }
          }

          for (let otherAula = 0; otherAula < result.length && !tooSimilar; otherAula += 1) {
            if (otherAula === aulaIndex) {
              continue;
            }
            for (const otherSemana of result[otherAula].semanas) {
              const other = String(otherSemana[field] || "").trim();
              if (!other) {
                continue;
              }
              const sim = computeTextSimilarity(current, other);
              maxSimilaridade = Math.max(maxSimilaridade, sim);
              if (sim > SIMILARITY_THRESHOLD) {
                tooSimilar = true;
                break;
              }
            }
          }

          if (!tooSimilar) {
            break;
          }

          current = rewriteField(field, current, weekIndex, conteudo, attempt + 1);
        }

        semana[field] = current;
      }
    }
  }

  return { aulas: result, maxSimilaridade };
}

export { SIMILARITY_THRESHOLD };
