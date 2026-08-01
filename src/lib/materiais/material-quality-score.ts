export type QualityScoreTone = "emerald" | "amber" | "rose";

export function computeQualityScore(
  issues: string[],
  alertas: string[] = [],
): number {
  const merged = [...issues, ...alertas].map((item) => String(item).trim()).filter(Boolean);
  const unique = [...new Set(merged)];

  if (!unique.length) return 100;

  let score = 100;

  for (const issue of unique) {
    const lower = issue.toLowerCase();
    if (
      lower.includes("genérico") ||
      lower.includes("generico") ||
      lower.includes("não referencia") ||
      lower.includes("nao referencia") ||
      lower.includes("tema estudado")
    ) {
      score -= 14;
      continue;
    }
    if (
      lower.includes("gabarito") ||
      lower.includes("alternativas") ||
      lower.includes("fracas") ||
      lower.includes("repetidas")
    ) {
      score -= 9;
      continue;
    }
    if (lower.includes("nenhum item") || lower.includes("esperado")) {
      score -= 11;
      continue;
    }
    score -= 5;
  }

  return Math.max(0, Math.min(100, score));
}

export function describeQualityScore(score: number): {
  label: string;
  tone: QualityScoreTone;
  hint: string;
} {
  if (score >= 90) {
    return {
      label: "Excelente",
      tone: "emerald",
      hint: "Material pronto para aplicar em sala com revisão leve.",
    };
  }
  if (score >= 88) {
    return {
      label: "Bom",
      tone: "amber",
      hint: "Quase no padrão Planify — revise os avisos ou use Elevar qualidade.",
    };
  }
  if (score >= 75) {
    return {
      label: "Regular+",
      tone: "amber",
      hint: "Abaixo do mínimo Planify (88) — regenere ou eleve a qualidade.",
    };
  }
  if (score >= 55) {
    return {
      label: "Regular",
      tone: "amber",
      hint: "Recomendamos regenerar com Elevar qualidade.",
    };
  }
  return {
    label: "Precisa melhorar",
    tone: "rose",
    hint: "Regenere o material — ainda há trechos genéricos ou incompletos.",
  };
}

export function buildElevateQualityObservacoes(problemas: string[]): string {
  const clean = problemas.map((item) => String(item).trim()).filter(Boolean);
  if (!clean.length) {
    return [
      "MODO ELEVAR QUALIDADE: o professor pediu regeneração focada.",
      "Reescreva com enunciados específicos ao tema, gabarito comentado e zero texto genérico.",
    ].join("\n");
  }

  return [
    "MODO ELEVAR QUALIDADE — REGENERAÇÃO FOCADA:",
    "Corrija exatamente os problemas abaixo na nova versão:",
    ...clean.map((item) => `- ${item}`),
    "Proibido repetir enunciados genéricos. Cada questão/seção deve citar o tema ou subconceito pedido.",
  ].join("\n");
}
