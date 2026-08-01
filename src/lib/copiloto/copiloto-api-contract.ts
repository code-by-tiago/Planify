export type CopilotoApiErrorBody = {
  ok?: boolean;
  success?: boolean;
  message?: string;
  error?: { message?: string; code?: string };
  code?: string;
};

export class CopilotoApiError extends Error {
  code?: string;
  status: number;

  constructor(
    message: string,
    options?: { code?: string; status?: number },
  ) {
    super(message);
    this.name = "CopilotoApiError";
    this.code = options?.code;
    this.status = options?.status ?? 500;
  }
}

export function extractCopilotoApiMessage(
  data: CopilotoApiErrorBody | null | undefined,
  fallback: string,
): string {
  return (
    data?.error?.message?.trim() ||
    data?.message?.trim() ||
    fallback
  );
}

export function extractCopilotoApiCode(
  data: CopilotoApiErrorBody | null | undefined,
): string | undefined {
  return data?.error?.code || data?.code;
}

export function isCopilotoApiFailure(
  response: Response,
  data: CopilotoApiErrorBody | null | undefined,
): boolean {
  if (!response.ok) return true;
  if (data?.success === false) return true;
  if (data?.ok === false) return true;
  return false;
}

export function throwCopilotoApiError(
  response: Response,
  data: CopilotoApiErrorBody | null | undefined,
  fallback: string,
): never {
  const message = extractCopilotoApiMessage(data, fallback);
  const code = extractCopilotoApiCode(data);
  throw new CopilotoApiError(message, {
    code:
      code ||
      (response.status === 401
        ? "auth_required"
        : response.status === 403
          ? "premium_required"
          : undefined),
    status: response.status,
  });
}
