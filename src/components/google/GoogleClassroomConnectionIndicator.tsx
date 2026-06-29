"use client";

import {
  fetchGoogleStatus,
  startGoogleClassroomOAuth,
  type GoogleIntegrationStatus,
} from "@/lib/google/google-api-client";
import { GOOGLE_STATUS_CHANGED_EVENT } from "@/lib/google/google-status-events";
import { useCallback, useEffect, useState } from "react";

type GoogleClassroomConnectionIndicatorProps = {
  returnTo: string;
};

export function GoogleClassroomConnectionIndicator({
  returnTo,
}: GoogleClassroomConnectionIndicatorProps) {
  const [status, setStatus] = useState<GoogleIntegrationStatus | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const next = await fetchGoogleStatus().catch(() => null);
    setStatus(next);
  }, []);

  useEffect(() => {
    void refresh();

    window.addEventListener(GOOGLE_STATUS_CHANGED_EVENT, refresh);
    window.addEventListener("focus", refresh);

    return () => {
      window.removeEventListener(GOOGLE_STATUS_CHANGED_EVENT, refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);

  if (!status?.authenticated || !status.connected) {
    return null;
  }

  const connected = Boolean(status.classroomScopeGranted && status.googleEmail);

  if (connected) {
    return (
      <span
        title={status.googleEmail || undefined}
        className="hidden shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-800 sm:inline-flex"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Google Classroom conectado
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => {
        setBusy(true);
        void startGoogleClassroomOAuth(returnTo, {
          selectAccount: true,
          loginHint: status.googleEmail || undefined,
        }).catch(() => setBusy(false));
      }}
      className="hidden shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-black text-amber-800 transition hover:bg-amber-100 disabled:opacity-60 sm:inline-flex"
    >
      {busy ? "Abrindo Google..." : "Reconectar Google"}
    </button>
  );
}
