import { NextRequest, NextResponse } from "next/server";
import { getSentryDsn } from "@/lib/ops/sentry-dsn";
import {
  logOperationalEvent,
  type OperationalEventType,
} from "./operational-telemetry";

export type OperationalCaptureContext = {
  eventType: OperationalEventType;
  toolTipo: string;
};

type RouteHandler = (
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
) => Promise<NextResponse | Response>;

async function captureToSentry(error: unknown, context: OperationalCaptureContext): Promise<void> {
  if (!getSentryDsn()) return;

  try {
    const Sentry = await import("@sentry/nextjs");
    Sentry.captureException(error, {
      tags: {
        tool_tipo: context.toolTipo,
        event_type: context.eventType,
      },
      extra: {
        // No PII — only operational context
        toolTipo: context.toolTipo,
        eventType: context.eventType,
      },
    });
  } catch {
    // Sentry must not break the route
  }
}

/**
 * Wraps an IA route handler: on uncaught errors or 502 responses, logs operational event + Sentry (no PII).
 */
export function withOperationalCapture(
  context: OperationalCaptureContext,
  handler: RouteHandler,
): RouteHandler {
  return async (request, routeContext) => {
    const started = Date.now();

    try {
      const response = await handler(request, routeContext);

      if (response.status === 502 || response.status === 503) {
        logOperationalEvent({
          eventType: context.eventType,
          toolTipo: context.toolTipo,
          ok: false,
          errorCode: "api_502",
          durationMs: Date.now() - started,
        });

        await captureToSentry(
          new Error(`HTTP ${response.status} on ${context.toolTipo}`),
          context,
        );
      }

      return response;
    } catch (error) {
      logOperationalEvent({
        eventType: context.eventType,
        toolTipo: context.toolTipo,
        ok: false,
        errorCode: "exception",
        durationMs: Date.now() - started,
        metadata: {
          message: error instanceof Error ? error.message : "unknown",
        },
      });

      await captureToSentry(error, context);

      return NextResponse.json(
        {
          ok: false,
          code: "server_error",
          message: "Servidor ocupado. Aguarde alguns segundos e tente novamente.",
          retryable: true,
        },
        { status: 502 },
      );
    }
  };
}
