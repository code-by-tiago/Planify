import type { PlanningMatrixItem, PlanningSkill } from "@/server/planejamentos/planning-ai-service";

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

function normalizeSearch(value: unknown): string {
  return normalizeText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function formatHabilidadesBnccAnual(skills: PlanningSkill[]): string {
  return skills
    .slice(0, 3)
    .map((skill) => {
      const code = normalizeText(skill.codigo);
      const desc = normalizeText(skill.descricao);
      if (!code) return desc;
      return desc ? `${code}: ${desc}` : code;
    })
    .filter(Boolean)
    .join(" ");
}

export function enrichObjetoConhecimento(conteudo: string, habilidades: PlanningSkill[]): string {
  const parts: string[] = [];
  const seen = new Set<string>();

  for (const text of [conteudo, ...habilidades.map((skill) => skill.conteudo)]) {
    const normalized = normalizeText(text);
    const key = normalizeSearch(normalized);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    parts.push(normalized);
  }

  return parts.join(". ");
}

export function enrichUnidadeTematica(
  conteudo: string,
  component: string,
  habilidades: PlanningSkill[],
): string {
  const normalizedContent = normalizeSearch(conteudo);
  const normalizedComponent = normalizeSearch(component);

  if (normalizedComponent.includes("portugues") || normalizedComponent.includes("lingua portuguesa")) {
    if (
      /morfolog|substantivo|adjetivo|verbo|adverbio|pronome|preposic|conjunc|interjec|numeral|bloco nominal|bloco verbal/.test(
        normalizedContent,
      )
    ) {
      return `Análise Linguística – Morfologia (${normalizeText(conteudo)})`;
    }

    if (/sintax|orac|predicado|sujeito|adjunto|complemento/.test(normalizedContent)) {
      return `Sintaxe – ${normalizeText(conteudo)}`;
    }

    if (/regencia|concordancia|crase|colocacao pronominal|norma.?padrao/.test(normalizedContent)) {
      return `Análise Linguística e Semiótica / Morfossintaxe aplicada ao texto (${normalizeText(conteudo)})`;
    }

    if (/variacao linguistica|variacao|diatopia|diastratica|diacronica/.test(normalizedContent)) {
      return "Análise Linguística/Semiótica";
    }

    if (/oralidade|debate|apresent|interacao discursiva|dialogo/.test(normalizedContent)) {
      return "Interação Discursiva";
    }

    if (/literatura|modernismo|contemporanea|poesia|romance/.test(normalizedContent)) {
      return `Literatura – ${normalizeText(conteudo)}`;
    }

    if (/leitura|interpret/.test(normalizedContent)) {
      return `Leitura – ${normalizeText(conteudo)}`;
    }

    if (/produ|redac|escrita|cronica|dissert|argument|genero/.test(normalizedContent)) {
      return `Escrita – ${normalizeText(conteudo)}`;
    }

    if (/revisao|avaliacao formativa|eac|recomposicao/.test(normalizedContent)) {
      return "EAC – Recomposição";
    }
  }

  if (normalizedComponent.includes("historia")) {
    if (/brasil|colonial|escravid|independ|republica/.test(normalizedContent)) {
      return "Brasil: colônia, escravidão, independência e República";
    }

    return "Tempo, memória, cultura e sociedade";
  }

  if (normalizedComponent.includes("geografia")) {
    return "O sujeito e seu lugar no mundo";
  }

  if (normalizedComponent.includes("matematica")) {
    return "Números, álgebra, geometria e grandezas";
  }

  if (normalizedComponent.includes("ciencias")) {
    return "Matéria, energia, vida e evolução";
  }

  const skillArea = normalizeText(habilidades[0]?.area);
  if (skillArea) {
    return `${skillArea} – ${normalizeText(conteudo)}`;
  }

  return normalizeText(conteudo);
}

export function deriveExpectativaAprendizagem(conteudo: string, habilidades: PlanningSkill[]): string {
  const tema = normalizeText(conteudo).replace(/\.$/, "");
  if (!tema) {
    return "";
  }

  const lines = habilidades
    .map((skill) => {
      const desc = normalizeText(skill.descricao);
      if (!desc) {
        return "";
      }

      const descKey = normalizeSearch(desc).slice(0, 24);
      const temaKey = normalizeSearch(tema).slice(0, 24);

      if (temaKey && descKey && !normalizeSearch(desc).includes(temaKey)) {
        return `${desc.replace(/\.$/, "")}, com ênfase em ${tema}.`;
      }

      return desc;
    })
    .filter(Boolean);

  if (lines.length > 0) {
    return lines.join(" ");
  }

  return `Ao estudar ${tema}, demonstrar aprendizagens alinhadas às habilidades da BNCC para a etapa.`;
}

export function formatPeriodosComSemanas(periodos: number, weeklyPeriods: number): string {
  const safePeriodos = Math.max(1, Math.round(periodos));
  const base = safePeriodos === 1 ? "1 período" : `${safePeriodos} períodos`;

  if (!Number.isFinite(weeklyPeriods) || weeklyPeriods <= 0) {
    return base;
  }

  const weeks = safePeriodos / weeklyPeriods;
  if (weeks <= 0) {
    return base;
  }

  if (Math.abs(weeks - 0.5) < 0.05) {
    return `${base} (meia semana)`;
  }

  if (Math.abs(weeks - 1) < 0.05) {
    return `${base} (1 semana)`;
  }

  if (Math.abs(weeks - 1.5) < 0.05) {
    return `${base} (1 semana e meia)`;
  }

  if (Math.abs(weeks - 2) < 0.05) {
    return `${base} (2 semanas)`;
  }

  if (Math.abs(weeks - 2.5) < 0.05) {
    return `${base} (2 semanas e meia)`;
  }

  const rounded = Math.round(weeks * 2) / 2;
  if (Number.isInteger(rounded)) {
    return `${base} (${rounded} semana${rounded > 1 ? "s" : ""})`;
  }

  const whole = Math.floor(rounded);
  return `${base} (${whole} semana${whole > 1 ? "s" : ""} e meia)`;
}

export function resolveWeeklyPeriodsFromPayload(cargaHoraria: unknown): number {
  const text = normalizeText(cargaHoraria);
  const semanalMatch = text.match(/semanal[^\d]*(\d+)/i);
  if (semanalMatch) {
    const parsed = Number(semanalMatch[1]);
    if (parsed > 0) return parsed;
  }

  const numbers = text.match(/\d+/g)?.map(Number).filter((n) => n > 0) ?? [];
  if (numbers.length >= 3) {
    const [annual, trimestral, semanal] = numbers;
    if (semanal && annual && trimestral && Math.abs(trimestral * 3 - annual) <= 3) {
      return semanal;
    }
  }

  if (numbers.length >= 1) {
    const annual = numbers[0];
    if (annual > 0) {
      const inferred = Math.round(annual / 40);
      if (inferred >= 2 && inferred <= 6) {
        return inferred;
      }
    }
  }

  return 4;
}

export function annualMatrixItemForTemplate(
  item: PlanningMatrixItem,
  _component: string,
  _weeklyPeriods: number,
): PlanningMatrixItem {
  return {
    ...item,
    conteudo: enrichObjetoConhecimento(item.conteudo, item.habilidades || []),
    objetivos: deriveExpectativaAprendizagem(item.conteudo, item.habilidades || []),
  };
}
