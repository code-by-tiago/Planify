import { computeQualityScore } from "@/lib/materiais/material-quality-score";
import type { CorrectionAiOutput } from "@/types/correction";

export type CorrectionQualityAssessment =
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

const GENERIC_FEEDBACK_RE =
  /^(bom trabalho|ótimo trabalho|otimo trabalho|parab[eé]ns|muito bem|excelente)[.!?\s]*$/i;

function collectIssues(result: CorrectionAiOutput): string[] {
  const issues: string[] = [];
  const feedback = String(result.feedbackGeral || "").trim();

  if (!feedback || feedback.length < 20) {
    issues.push("Devolutiva geral ausente ou muito curta para uso em sala.");
  }

  if (GENERIC_FEEDBACK_RE.test(feedback)) {
    issues.push("Devolutiva genérica — falta análise específica da resposta do estudante.");
  }

  if (!Array.isArray(result.criterios) || result.criterios.length === 0) {
    issues.push("Nenhum critério da rubrica foi avaliado na correção.");
  } else {
    const emptyComments = result.criterios.filter(
      (item) => !String(item.comentario || "").trim(),
    ).length;
    if (emptyComments > 0) {
      issues.push("Há critérios da rubrica sem comentário pedagógico.");
    }
  }

  if (!Number.isFinite(result.nota)) {
    issues.push("Nota inválida na correção.");
  }

  const notaMaxima = Number(result.notaMaxima) || 10;
  if (result.nota < 0 || result.nota > notaMaxima) {
    issues.push("Nota fora do intervalo permitido pela rubrica.");
  }

  if (!result.pontosFortes?.length) {
    issues.push("Inclua pelo menos um ponto forte identificado na resposta.");
  }

  if (!result.pontosMelhoria?.length) {
    issues.push("Inclua pelo menos uma orientação de melhoria para o estudante.");
  }

  if (!String(result.sugestaoProfessor || "").trim()) {
    issues.push("Falta sugestão breve para o professor usar em sala.");
  }

  return issues;
}

export function assessCorrectionQuality(
  result: CorrectionAiOutput,
): CorrectionQualityAssessment {
  const qualityIssues = collectIssues(result);
  const qualityScore = computeQualityScore(qualityIssues);

  const critical =
    qualityIssues.some((issue) =>
      /ausente|muito curta|Nenhum crit[eé]rio|Nota inv[aá]lida|fora do intervalo/i.test(
        issue,
      ),
    ) || qualityScore < 55;

  if (critical) {
    return {
      pass: false,
      qualityScore,
      qualityIssues,
      message: `A correção não atingiu o padrão mínimo (${qualityScore}/100). ${qualityIssues.slice(0, 2).join(" ")} Tente novamente com enunciado, gabarito ou rubrica mais claros.`,
    };
  }

  return { pass: true, qualityScore, qualityIssues };
}
