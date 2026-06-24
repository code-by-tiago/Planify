"use client";

import { hasExportableHtml, peekGoogleOAuthReturnSignal } from "@/lib/google/google-export-resume";
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
      if (!peekGoogleOAuthReturnSignal()) return false;

      const active = paramsRef.current;
      const signal = peekGoogleOAuthReturnSignal();
      const needsHtml = signal?.connected && !signal.error;

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
      if (handled || !peekGoogleOAuthReturnSignal()) {
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
    }, 12_000);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, []);
}
