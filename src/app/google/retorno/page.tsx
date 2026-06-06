"use client";

import { useEffect, useState } from "react";
import { fetchPlanifyAccessStatus } from "@/lib/auth/access-client";
import {
  ensurePremiumSessionCookies,
  getCurrentAccessToken,
} from "@/lib/auth/session-client";

function sanitizeReturnTo(value: string | null): string {
  const raw = String(value || "/dashboard?secao=editor").trim();
  if (!raw.startsWith("/") || raw.startsWith("//")) {
    return "/dashboard?secao=editor";
  }
  return raw;
}

function buildDestination(
  returnTo: string,
  googleStatus: string | null,
  googleError: string | null,
): string {
  const destination = new URL(returnTo, window.location.origin);

  if (googleStatus) {
    destination.searchParams.set("google", googleStatus);
  }
  if (googleError) {
    destination.searchParams.set("google_error", googleError);
  }

  return destination.pathname + destination.search;
}

export default function GoogleOAuthReturnPage() {
  const [message, setMessage] = useState("Finalizando conexão com o Google…");

  useEffect(() => {
    let active = true;

    void (async () => {
      const params = new URLSearchParams(window.location.search);
      const returnTo = sanitizeReturnTo(params.get("returnTo"));
      const googleStatus = params.get("google");
      const googleError = params.get("google_error");
      const destination = buildDestination(returnTo, googleStatus, googleError);

      const token = await getCurrentAccessToken();

      if (!token) {
        const loginUrl = `/login?redirect=${encodeURIComponent(destination)}`;
        // #region agent log
        fetch("http://127.0.0.1:7616/ingest/e1530077-9aac-4460-b700-4c831c23c281", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "920c67",
          },
          body: JSON.stringify({
            sessionId: "920c67",
            runId: "google-oauth-post-fix-v2",
            hypothesisId: "A",
            location: "google/retorno/page.tsx",
            message: "no supabase token — login redirect",
            data: { returnTo },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
        if (active) window.location.replace(loginUrl);
        return;
      }

      let cookiesReady = false;

      for (let attempt = 0; attempt < 3; attempt += 1) {
        await ensurePremiumSessionCookies();
        const cookieStatus = await fetchPlanifyAccessStatus();
        if (cookieStatus.authenticated) {
          cookiesReady = true;
          break;
        }
      }

      const bearerStatus = await fetchPlanifyAccessStatus(token);

      // #region agent log
      fetch("http://127.0.0.1:7616/ingest/e1530077-9aac-4460-b700-4c831c23c281", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "920c67",
        },
        body: JSON.stringify({
          sessionId: "920c67",
          runId: "google-oauth-post-fix-v2",
          hypothesisId: "A",
          location: "google/retorno/page.tsx",
          message: "oauth return session check",
          data: {
            returnTo,
            cookiesReady,
            bearerAuthenticated: bearerStatus.authenticated,
            googleStatus,
            hasError: Boolean(googleError),
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion

      if (!active) return;

      if (!bearerStatus.authenticated) {
        window.location.replace(
          `/login?redirect=${encodeURIComponent(destination)}`,
        );
        return;
      }

      if (!cookiesReady) {
        await ensurePremiumSessionCookies();
      }

      setMessage("Voltando ao editor…");
      window.location.replace(destination);
    })();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="rounded-2xl border border-sky-200 bg-white px-8 py-6 text-center shadow-sm">
        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-sky-200 border-t-sky-600" />
        <p className="mt-4 text-sm font-semibold text-slate-700">{message}</p>
      </div>
    </main>
  );
}
