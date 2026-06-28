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

const RESUME_DONE_KEY = "planify:google-oauth-resume-done";

let globalResumeStarted = false;

export function useGoogleOAuthResume(params: UseGoogleOAuthResumeParams): void {
  const paramsRef = useRef(params);
  paramsRef.current = params;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (globalResumeStarted) return;

    try {
      if (window.sessionStorage.getItem(RESUME_DONE_KEY) === "1") {
        globalResumeStarted = true;
        return;
      }
    } catch {
      /* ignore */
    }

    const hasResumeIntent = Boolean(peekGoogleOAuthResumeIntent());
    if (!hasResumeIntent) {
      return;
    }

    globalResumeStarted = true;

    void (async () => {
      const active = paramsRef.current;
      const pending = findActiveGoogleExportPending();
      const getHtml = active.getHtml;

      if (pending) {
        const snapshot = pending.pending.html?.trim() || "";
        if (!hasExportableHtml(snapshot) && !hasExportableHtml(getHtml())) {
          globalResumeStarted = false;
          return;
        }
      }

      const handled = await resumePendingGoogleExport(active);

      if (handled) {
        try {
          window.sessionStorage.setItem(RESUME_DONE_KEY, "1");
        } catch {
          /* ignore */
        }
      } else {
        globalResumeStarted = false;
      }
    })();
  }, []);
}
