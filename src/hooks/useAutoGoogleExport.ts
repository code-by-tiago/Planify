"use client";

import {
  clearAutoGoogleExportIntent,
  executeAutoGoogleExport,
  readAutoGoogleExportIntent,
} from "@/lib/google/google-auto-export";
import { useEffect, useRef } from "react";

function hasExportableHtml(getHtml: () => string): boolean {
  try {
    const text = getHtml()
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return text.length >= 20;
  } catch {
    return false;
  }
}

type UseAutoGoogleExportParams = {
  title: string;
  getHtml: () => string;
  slideTheme?: string | null;
  returnTo?: string;
  onStatus?: (message: string) => void;
};

export function useAutoGoogleExport({
  title,
  getHtml,
  slideTheme,
  returnTo,
  onStatus,
}: UseAutoGoogleExportParams): void {
  const started = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || started.current) return;

    const intent = readAutoGoogleExportIntent();
    if (!intent) return;

    const resolvedReturnTo =
      returnTo ||
      `${window.location.pathname}${window.location.search}` ||
      "/editor?from=materiais";

    const run = async (): Promise<boolean> => {
      if (!hasExportableHtml(getHtml)) {
        return false;
      }

      started.current = true;
      clearAutoGoogleExportIntent();

      const result = await executeAutoGoogleExport({
        product: intent.product,
        title: title.trim() || intent.title,
        getHtml,
        returnTo: intent.returnTo || resolvedReturnTo,
        slideTheme: slideTheme ?? intent.slideTheme,
      });

      // #region agent log
      fetch("http://127.0.0.1:7616/ingest/e1530077-9aac-4460-b700-4c831c23c281", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "82e773" },
        body: JSON.stringify({
          sessionId: "82e773",
          runId: "post-fix",
          hypothesisId: "H-A",
          location: "useAutoGoogleExport.ts:run",
          message: "auto google export executed",
          data: {
            product: intent.product,
            result,
            autoExportOnGeneration: true,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion

      if (result === "exported") {
        const label =
          intent.product === "slides"
            ? "Google Slides"
            : intent.product === "forms"
              ? "Google Forms"
              : "Google Docs";
        onStatus?.(`${label} aberto automaticamente em nova aba.`);
      } else if (result === "oauth_started" || result === "login_required") {
        onStatus?.("Conecte sua conta Google para concluir a exportação.");
      } else if (result === "failed") {
        onStatus?.(
          "Exportação automática indisponível. Use o botão Google na barra superior.",
        );
      }

      return true;
    };

    void run();

    const intervalId = window.setInterval(() => {
      if (started.current) {
        window.clearInterval(intervalId);
        return;
      }
      void run().then((done) => {
        if (done) window.clearInterval(intervalId);
      });
    }, 400);

    const timeoutId = window.setTimeout(() => {
      window.clearInterval(intervalId);
    }, 10_000);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [getHtml, onStatus, returnTo, slideTheme, title]);
}
