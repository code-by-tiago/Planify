import { computeQualityScore } from "@/lib/materiais/material-quality-score";
import {
  hasCriticalQualityIssues,
  isCriticalQualityIssue,
} from "@/lib/materiais/unified-quality-gate";
import type { QualityAssessment } from "@/server/generation/quality-retry";

export type PeiQualityInput = {
  perfil: string;
  suportes: string[];
  acessibilidade: string[];
  curricularRows: Array<{ conteudo: string; habilidade: string }>;
  planejamento: Array<{ periodo: string; metodologia: string }>;
  parecer: string;
  usedAI: boolean;
};

const CHITCHAT_PATTERNS: RegExp[] = [
  /como (um )?assistente/i,
  /n[aã]o posso ajudar/i,
  /sou (um )?modelo de linguagem/i,
];

function collectIssues(input: PeiQualityInput): string[] {
  const issues: string[] = [];
  const parecer = String(input.parecer || "").trim();
  const perfil = String(input.perfil || "").trim();

  if (!perfil) {
    issues.push("Perfil educacional do estudante ausente ou incompleto.");
  }

  if (input.curricularRows.length < 2) {
    issues.push("Tabela curricular com poucas linhas — vincule conteúdos e habilidades BNCC.");
  } else {
    const emptyRows = input.curricularRows.filter(
      (row) => !row.conteudo?.trim() || !row.habilidade?.trim(),
    ).length;
    if (emptyRows > 0) {
      issues.push("Há linhas curriculares sem conteúdo ou habilidade preenchidos.");
    }
  }

  if (input.planejamento.length < 2) {
    issues.push("Planejamento das ações com poucos períodos — detalhe metodologia e avaliação.");
  }

  if (input.suportes.length < 3) {
    issues.push("Liste estratégias de suporte pedagógico mais específicas para o perfil.");
  }

  if (input.acessibilidade.length < 2) {
    issues.push("Descreva adaptações curriculares e recursos de acessibilidade.");
  }

  if (!parecer || parecer.length < 200) {
    issues.push("Parecer pedagógico muito curto para uso institucional.");
  }

  if (CHITCHAT_PATTERNS.some((pattern) => pattern.test(parecer))) {
    issues.push("Parecer conversacional detectado — use linguagem institucional aplicável em sala.");
  }

  if (!input.usedAI) {
    issues.push(
      "PEI estruturado pelo motor seguro — revise colaborativamente com a equipe escolar.",
    );
  }

  return issues;
}

export function assessPeiQuality(input: PeiQualityInput): QualityAssessment {
  const qualityIssues = collectIssues(input);
  const qualityScore = computeQualityScore(qualityIssues);

  if (hasCriticalQualityIssues(qualityIssues)) {
    return {
      pass: false,
      qualityScore,
      qualityIssues,
      message: `O PEI não passou no controle de qualidade (${qualityScore}/100). ${qualityIssues.filter(isCriticalQualityIssue).slice(0, 2).join(" ")} Revise os dados do estudante e gere novamente.`,
    };
  }

  const hasHardFailure = qualityIssues.some((issue) =>
    /ausente|muito curto|conversacional/i.test(issue),
  );

  if (hasHardFailure && qualityScore < 80) {
    return {
      pass: false,
      qualityScore,
      qualityIssues,
      message: `O PEI ficou abaixo do padrão mínimo (${qualityScore}/100). Complete conteúdos, habilidades e parecer antes de anexar ao registro.`,
    };
  }

  if (qualityScore < 72) {
    return {
      pass: false,
      qualityScore,
      qualityIssues,
      message: `O PEI ficou abaixo do padrão mínimo (${qualityScore}/100). Revise os campos e gere novamente.`,
    };
  }

  return { pass: true, qualityScore, qualityIssues };
}
