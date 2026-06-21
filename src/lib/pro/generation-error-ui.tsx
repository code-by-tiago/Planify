"use client";

import Link from "next/link";
import {
  useCallback,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { LessonBundleError } from "@/lib/aula-completa/lesson-bundle-client";
import { CorrectionError } from "@/lib/correcao/correcao-client";
import { CorrectionOcrError } from "@/lib/correcao/correcao-ocr-client";

export type GenerationErrorCode =
  | "insufficient_credits"
  | "daily_limit_reached"
  | "generation_in_progress"
  | "offline"
  | "timeout"
  | "server_error"
  | "quality_gate_failed"
  | "ai_unavailable"
  | "ai_billing";

export type FormattedGenerationError = {
  message: string;
  code?: GenerationErrorCode;
  cta?: ReactNode;
  retryable: boolean;
};

const DAILY_LIMIT_MESSAGE =
  "Você usou suas gerações profundas de hoje. A cota reinicia à meia-noite (horário de Brasília).";

function statusPageCta(): ReactNode {
  return (
    <Link href="/status" className="font-bold underline">
      Ver status dos serviços
    </Link>
  );
}

function plansCta(): ReactNode {
  return (
    <Link href="/planos" className="font-bold underline">
      Ver planos
    </Link>
  );
}

function extractErrorCode(error: unknown): string | undefined {
  if (error instanceof LessonBundleError || error instanceof CorrectionError) {
    return error.code;
  }
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === "string" ? code : undefined;
  }
  return undefined;
}

function extractStatus(error: unknown): number | undefined {
  if (
    error instanceof LessonBundleError ||
    error instanceof CorrectionError ||
    error instanceof CorrectionOcrError
  ) {
    return error.status;
  }
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status?: unknown }).status;
    return typeof status === "number" ? status : undefined;
  }
  return undefined;
}

function isOfflineError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === "AbortError") {
    return true;
  }
  if (error instanceof TypeError) {
    return true;
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes("failed to fetch") ||
      msg.includes("network") ||
      msg.includes("load failed")
    );
  }
  return false;
}

export function formatGenerationError(error: unknown): FormattedGenerationError {
  const code = extractErrorCode(error);
  const status = extractStatus(error);

  if (code === "daily_limit_reached") {
    return {
      message: `${DAILY_LIMIT_MESSAGE} Isso é limite do seu plano, não indisponibilidade da IA.`,
      code: "daily_limit_reached",
      cta: plansCta(),
      retryable: false,
    };
  }

  if (code === "generation_in_progress" || status === 409) {
    const rawMessage =
      error instanceof Error ? error.message.trim() : "";
    return {
      message:
        rawMessage ||
        "Já existe uma geração em andamento. Aguarde a conclusão antes de tentar de novo.",
      code: "generation_in_progress",
      retryable: false,
    };
  }

  if (code === "ai_billing") {
    const rawMessage =
      error instanceof Error ? error.message.trim() : "";
    return {
      message:
        rawMessage ||
        "Créditos de IA esgotados no Google AI Studio. Recarregue o saldo ou habilite faturação e tente novamente.",
      code: "ai_billing",
      retryable: false,
    };
  }

  if (code === "ai_unavailable") {
    const rawMessage =
      error instanceof Error ? error.message.trim() : "";
    return {
      message:
        rawMessage ||
        "A IA está indisponível no momento. Aguarde alguns instantes e tente novamente.",
      code: "ai_unavailable",
      cta: statusPageCta(),
      retryable: true,
    };
  }

  if (code === "quality_gate_failed" || status === 422) {
    const rawMessage =
      error instanceof Error ? error.message.trim() : "";
    return {
      message:
        rawMessage ||
        "O conteúdo não atingiu o padrão mínimo Planify. Use Elevar qualidade ou ajuste o tema e gere novamente.",
      code: "quality_gate_failed",
      retryable: true,
    };
  }

  if (code === "insufficient_credits") {
    return {
      message: "Você não tem créditos suficientes para esta ação.",
      code: "insufficient_credits",
      cta: plansCta(),
      retryable: false,
    };
  }

  if (status === 502 || status === 503 || code === "server_error") {
    const rawMessage =
      error instanceof Error ? error.message.trim() : "";
    const isGenericOperationalMessage =
      !rawMessage ||
      rawMessage === "Não foi possível gerar o material." ||
      rawMessage ===
        "Servidor ocupado. Aguarde alguns segundos e tente novamente.";

    if (!isGenericOperationalMessage) {
      return {
        message: rawMessage,
        code: "server_error",
        retryable: true,
      };
    }

    return {
      message: "Servidor ocupado. Aguarde alguns segundos e tente novamente.",
      code: "server_error",
      retryable: true,
    };
  }

  if (code === "timeout" || status === 504) {
    const rawMessage =
      error instanceof Error ? error.message.trim() : "";
    return {
      message:
        rawMessage && rawMessage !== "A operação demorou demais. Tente novamente."
          ? rawMessage
          : "A operação demorou demais. Tente novamente com menos itens ou aguarde alguns instantes.",
      code: "timeout",
      retryable: false,
    };
  }

  if (isOfflineError(error)) {
    return {
      message: "Sem conexão. Verifique a internet e tente novamente.",
      code: "offline",
      retryable: true,
    };
  }

  if (error instanceof LessonBundleError) {
    return {
      message: error.message,
      retryable: false,
    };
  }

  if (error instanceof CorrectionError || error instanceof CorrectionOcrError) {
    return {
      message: error.message,
      retryable: status === 502 || status === 503,
    };
  }

  return {
    message:
      error instanceof Error
        ? error.message
        : "Não foi possível concluir a operação.",
    retryable: false,
  };
}

export function dispatchCreditsChangedIfNeeded(error: unknown): void {
  const code = extractErrorCode(error);
  if (code === "daily_limit_reached" && typeof window !== "undefined") {
    window.dispatchEvent(new Event("planify:credits-changed"));
  }
}

type GenerationErrorBannerProps = {
  message: string;
  cta?: ReactNode;
  retryable?: boolean;
  onRetry?: () => void;
  retrying?: boolean;
  className?: string;
};

export function GenerationErrorBanner({
  message,
  cta,
  retryable = false,
  onRetry,
  retrying = false,
  className = "",
}: GenerationErrorBannerProps) {
  if (!message) return null;

  return (
    <div
      className={`rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 ${className}`}
      role="alert"
    >
      <p>
        {message}
        {cta ? <> {" "}{cta}</> : null}
      </p>
      {retryable && onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="mt-2 text-xs font-bold underline disabled:opacity-50"
        >
          {retrying ? "Tentando novamente…" : "Tentar novamente"}
        </button>
      ) : null}
    </div>
  );
}

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_BASE_MS = 1000;

export function useRetryableAction() {
  const [retrying, setRetrying] = useState(false);
  const attemptRef = useRef(0);

  const resetRetries = useCallback(() => {
    attemptRef.current = 0;
  }, []);

  const runWithRetry = useCallback(
    async (action: () => Promise<void>, options?: { onError?: (error: unknown) => void }) => {
      resetRetries();
      setRetrying(true);

      while (attemptRef.current < MAX_RETRY_ATTEMPTS) {
        try {
          await action();
          attemptRef.current = 0;
          setRetrying(false);
          return;
        } catch (error) {
          const formatted = formatGenerationError(error);
          options?.onError?.(error);

          if (!formatted.retryable || attemptRef.current >= MAX_RETRY_ATTEMPTS - 1) {
            setRetrying(false);
            throw error;
          }

          attemptRef.current += 1;
          const delay = RETRY_BASE_MS * 2 ** (attemptRef.current - 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      setRetrying(false);
    },
    [resetRetries],
  );

  return { runWithRetry, retrying, resetRetries };
}

export function formatDurationEstimateBadge(estimatedDurationMs: number): string {
  const minMinutes = Math.max(1, Math.floor(estimatedDurationMs / 60_000));
  const maxMinutes = Math.max(minMinutes + 1, Math.ceil((estimatedDurationMs * 1.4) / 60_000));
  return `Estimativa: ${minMinutes}–${maxMinutes} min`;
}
