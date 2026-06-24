"use client";

import {
  hasExportableHtml,
  peekGoogleOAuthResumeIntent,
} from "@/lib/google/google-export-resume";
import {
  findActiveGoogleExportPending,
  resumePendingGoogleExport,
  type ResumePendingGoogleExportParams,
} from "@/lib/google/google-oauth-resume";
import { useEffect, useRef } from "react";

type UseGoogleOAuthResumeParams = ResumePendingGoogleExportParams;

export function useGoogleOAuthResume(params: UseGoogleOAuthResumeParams): void {
  const started = useRef(false);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const attemptResume = async (): Promise<boolean> => {
      if (started.current) return true;

      const intent = peekGoogleOAuthResumeIntent();
      if (!intent) return false;

      const active = paramsRef.current;
      const needsHtml = intent.connected && !intent.error;

      if (needsHtml) {
        const pending = findActiveGoogleExportPending();
        const getHtml = active.getHtml;

        if (pending) {
          const snapshot = pending.pending.html?.trim() || "";
          if (!hasExportableHtml(snapshot) && !hasExportableHtml(getHtml())) {
            return false;
          }
        }
      }

      const handled = await resumePendingGoogleExport(active);

      if (handled) {
        started.current = true;
        return true;
      }

      if (!peekGoogleOAuthResumeIntent()) {
        started.current = true;
        return true;
      }

      return false;
    };

    void attemptResume();

    const intervalId = window.setInterval(() => {
      if (started.current) {
        window.clearInterval(intervalId);
        return;
      }
      void attemptResume().then((done) => {
        if (done) window.clearInterval(intervalId);
      });
    }, 400);

    const timeoutId = window.setTimeout(() => {
      window.clearInterval(intervalId);
    }, 30_000);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, []);
}
