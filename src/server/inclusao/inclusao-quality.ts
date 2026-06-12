import type { InclusaoModeId } from "@/lib/inclusao/inclusao-config";
import { computeQualityScore } from "@/lib/materiais/material-quality-score";
import {
  hasCriticalQualityIssues,
  isCriticalQualityIssue,
} from "@/lib/materiais/unified-quality-gate";

export type InclusaoQualityInput = {
  modo: InclusaoModeId;
  markdown: string;
  sourceContent?: string;
};

export type InclusaoQualityAssessment =
  | {
      pass: true;
      qualityScore: number;
      qualityIssues: string[];
    }
  | {
      pass: false;
      qualityScore: number;
      qualityIssues: string[];
      message: string;
    };

const CHITCHAT_PATTERNS: RegExp[] = [
  /como (um )?assistente/i,
  /n[aã]o posso ajudar/i,
  /desculpe,? n[aã]o consigo/i,
  /sou (um )?modelo de linguagem/i,
];

const MIN_LENGTH_BY_MODE: Record<InclusaoModeId, number> = {
  mediacao: 80,
  adaptacao: 120,
  trilhas: 140,
  relatorio: 160,
};

function normalizeCompareText(value: string): string {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function hasStructuredSections(markdown: string): boolean {
  return (
    /^#{1,3}\s/m.test(markdown) ||
    /^\s*[-*]\s/m.test(markdown) ||
    /^\s*\d+[.)]\s/m.test(markdown)
  );
}

function collectIssues(input: InclusaoQualityInput): string[] {
  const issues: string[] = [];
  const markdown = String(input.markdown || "").trim();
  const minLength = MIN_LENGTH_BY_MODE[input.modo] ?? 100;

  if (!markdown) {
    issues.push("A adaptação inclusiva veio vazia.");
    return issues;
  }

  if (markdown.length < minLength) {
    issues.push(
      `Conteúdo muito curto para o modo ${input.modo} (mínimo esperado ~${minLength} caracteres).`,
    );
  }

  if (input.modo !== "mediacao" && !hasStructuredSections(markdown)) {
    issues.push(
      "Organize a resposta com títulos, tópicos ou listas para facilitar o uso em sala.",
    );
  }

  if (CHITCHAT_PATTERNS.some((pattern) => pattern.test(markdown))) {
    issues.push("Resposta conversacional detectada — conteúdo não aplicável em sala.");
  }

  const source = String(input.sourceContent || "").trim();
  if (source.length >= 40) {
    const normalizedSource = normalizeCompareText(source);
    const normalizedOutput = normalizeCompareText(markdown);

    if (normalizedOutput === normalizedSource) {
      issues.push(
        "O texto gerado repetiu o conteúdo original sem adaptações inclusivas concretas.",
      );
    } else if (
      normalizedOutput.includes(normalizedSource) &&
      markdown.length < source.length * 1.2
    ) {
      issues.push(
        "A adaptação não trouxe mudanças pedagógicas suficientes em relação ao material enviado.",
      );
    }
  }

  if (input.modo === "trilhas" && !/n[ií]vel|faixa|avan[cç]ad|intermedi|b[aá]sic/i.test(markdown)) {
    issues.push("Trilhas paralelas: indique níveis ou faixas de dificuldade distintas.");
  }

  if (input.modo === "relatorio" && !/estudante|aluno|fam[ií]lia|coordena|progresso/i.test(markdown)) {
    issues.push("Relatório: contextualize o estudante e o progresso observado.");
  }

  return issues;
}

export function assessInclusaoQuality(input: InclusaoQualityInput): InclusaoQualityAssessment {
  const qualityIssues = collectIssues(input);
  const qualityScore = computeQualityScore(qualityIssues);

  if (hasCriticalQualityIssues(qualityIssues)) {
    return {
      pass: false,
      qualityScore,
      qualityIssues,
      message: `A adaptação inclusiva não passou no controle de qualidade (${qualityScore}/100). ${qualityIssues.filter(isCriticalQualityIssue).slice(0, 2).join(" ")} Tente novamente com mais contexto no material ou nas observações.`,
    };
  }

  const hasHardFailure = qualityIssues.some((issue) =>
    /vazia|repetiu o conteúdo|conversacional/i.test(issue),
  );

  if (hasHardFailure || qualityScore < 62) {
    return {
      pass: false,
      qualityScore,
      qualityIssues,
      message: `A adaptação ficou abaixo do padrão mínimo (${qualityScore}/100). Revise o material de entrada ou gere novamente.`,
    };
  }

  return { pass: true, qualityScore, qualityIssues };
}
