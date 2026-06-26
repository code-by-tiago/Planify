export type QualityAssessment =
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

export type GenerateOutcome<T> =
  | ({ ok: true } & T)
  | { ok: false; status: number; message: string };

export type QualityRetrySuccess<T> = {
  ok: true;
  value: T;
  quality: QualityAssessment;
  retried: boolean;
};

export const DEFAULT_QUALITY_RETRY_NOTE =
  "Revisão automática de qualidade: corrija os problemas abaixo antes de entregar.";

/**
 * Gera → avalia → segunda tentativa com issues no contexto → escolhe melhor score.
 * Padrão usado em inclusão, correção e PEI.
 */
export async function runQualityRetry<TInput, T>(options: {
  input: TInput;
  generate: (input: TInput) => Promise<GenerateOutcome<T>>;
  assess: (value: T) => QualityAssessment;
  buildRetryInput: (input: TInput, issues: string[]) => TInput;
  retryNote?: string;
}): Promise<QualityRetrySuccess<T> | Extract<GenerateOutcome<T>, { ok: false }>> {
  const firstOutcome = await options.generate(options.input);
  if (!firstOutcome.ok) return firstOutcome;

  const firstValue = stripOk(firstOutcome);
  const firstQuality = options.assess(firstValue);

  if (firstQuality.pass) {
    return { ok: true, value: firstValue, quality: firstQuality, retried: false };
  }

  const retryInput = options.buildRetryInput(
    options.input,
    firstQuality.qualityIssues,
  );
  const secondOutcome = await options.generate(retryInput);

  if (!secondOutcome.ok) {
    return { ok: true, value: firstValue, quality: firstQuality, retried: true };
  }

  const secondValue = stripOk(secondOutcome);
  const secondQuality = options.assess(secondValue);

  if (secondQuality.qualityScore >= firstQuality.qualityScore) {
    return { ok: true, value: secondValue, quality: secondQuality, retried: true };
  }

  return { ok: true, value: firstValue, quality: firstQuality, retried: true };
}

function stripOk<T>(outcome: { ok: true } & T): T {
  const { ok: _ok, ...rest } = outcome;
  return rest as T;
}

export function appendQualityRetryNote(
  base: string | undefined,
  issues: string[],
  note: string = DEFAULT_QUALITY_RETRY_NOTE,
): string {
  return [base, note, ...issues.map((issue) => `- ${issue}`)]
    .filter(Boolean)
    .join("\n");
}
