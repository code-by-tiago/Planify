import { computeQualityScore } from "./material-quality-score";

/** Piso Teachy+ — entrega unificada (materiais e planejamentos). */
export const UNIFIED_MIN_QUALITY_SCORE = 88;

/** Abaixo deste valor, o banner "Elevar qualidade" fica em destaque. */
export const UNIFIED_ELEVATE_BANNER_THRESHOLD = 90;

export type QualityGateFailureCode =
  | "quality_score_low"
  | "critical_issues";

export type QualityGateAssessment =
  | { pass: true }
  | {
      pass: false;
      code: QualityGateFailureCode;
      message: string;
      qualityScore: number;
      qualityIssues: string[];
    };

const CRITICAL_ISSUE_PATTERNS: RegExp[] = [
  /nenhum item foi gerado/i,
  /nenhuma quest[aã]o/i,
  /nenhum slide/i,
  /matriz n[aã]o cont[eé]m/i,
  /inventad/i,
  /alucina/i,
  /bncc.*n[aã]o autoriz/i,
  /c[oó]digo bncc.*inv[aá]lid/i,
  /conversacional/i,
  /chitchat/i,
  /m[uú]ltipla escolha exige pelo menos 5/i,
  /gabarito e respostas devem aparecer somente/i,
  /esperad[oa].*recebid[oa]/i,
  /linha\(s\) sem per[ií]odos/i,
  /soma dos per[ií]odos/i,
];

export function isCriticalQualityIssue(issue: string): boolean {
  const text = String(issue || "").trim();
  if (!text) return false;
  return CRITICAL_ISSUE_PATTERNS.some((pattern) => pattern.test(text));
}

export function hasCriticalQualityIssues(issues: string[]): boolean {
  return issues.some(isCriticalQualityIssue);
}

export function buildQualityGateFailureMessage(
  qualityScore: number,
  qualityIssues: string[],
): string {
  const critical = qualityIssues.filter(isCriticalQualityIssue);
  if (critical.length > 0) {
    const preview = critical.slice(0, 3).join(" ");
    return `O conteúdo não passou no controle de qualidade Planify (${qualityScore}/100). ${preview} Use Elevar qualidade ou ajuste o tema e gere novamente.`;
  }
  return `O conteúdo ficou abaixo do padrão mínimo Planify (${qualityScore}/100 — mínimo ${UNIFIED_MIN_QUALITY_SCORE}). Use Elevar qualidade ou refine o tema antes de aplicar em sala.`;
}

export function assessUnifiedQualityGate(input: {
  qualityScore?: number | null;
  qualityIssues?: string[];
}): QualityGateAssessment {
  const qualityIssues = (input.qualityIssues ?? [])
    .map((item) => String(item).trim())
    .filter(Boolean);
  const qualityScore =
    typeof input.qualityScore === "number"
      ? input.qualityScore
      : computeQualityScore(qualityIssues);

  if (hasCriticalQualityIssues(qualityIssues)) {
    return {
      pass: false,
      code: "critical_issues",
      message: buildQualityGateFailureMessage(qualityScore, qualityIssues),
      qualityScore,
      qualityIssues,
    };
  }

  if (qualityScore < UNIFIED_MIN_QUALITY_SCORE) {
    return {
      pass: false,
      code: "quality_score_low",
      message: buildQualityGateFailureMessage(qualityScore, qualityIssues),
      qualityScore,
      qualityIssues,
    };
  }

  return { pass: true };
}

/** Exportação Google/DOCX — bloqueia quando há metadados de qualidade insuficientes. */
export function passesExportQualityGate(
  qualityScore: number | null | undefined,
  qualityIssues?: string[],
): boolean {
  const issues = (qualityIssues ?? [])
    .map((item) => String(item).trim())
    .filter(Boolean);

  if (qualityScore == null && issues.length === 0) {
    return true;
  }

  return assessUnifiedQualityGate({ qualityScore, qualityIssues: issues }).pass;
}

export class UnifiedQualityGateError extends Error {
  readonly code: QualityGateFailureCode;
  readonly qualityScore: number;
  readonly qualityIssues: string[];

  constructor(assessment: Extract<QualityGateAssessment, { pass: false }>) {
    super(assessment.message);
    this.name = "UnifiedQualityGateError";
    this.code = assessment.code;
    this.qualityScore = assessment.qualityScore;
    this.qualityIssues = assessment.qualityIssues;
  }
}
