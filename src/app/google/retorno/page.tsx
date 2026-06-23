"use client";

import { useEffect, useState } from "react";
import { fetchPlanifyAccessStatus } from "@/lib/auth/access-client";
import {
  ensurePremiumSessionCookies,
  getCurrentAccessToken,
} from "@/lib/auth/session-client";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { notifyGoogleStatusChanged } from "@/lib/google/google-status-events";

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

function buildLoginRedirect(destination: string, reason: "session_expired" | "auth_required") {
  const loginUrl = new URL("/login", window.location.origin);
  loginUrl.searchParams.set("redirect", destination);
  loginUrl.searchParams.set("sessao_expirada", reason === "session_expired" ? "1" : "0");
  return loginUrl.pathname + loginUrl.search;
}

async function resolveAccessTokenAfterOAuth(): Promise<string | null> {
  const supabase = getSupabaseBrowserClient();
  const { data: sessionData } = await supabase.auth.getSession();
  let token = sessionData.session?.access_token || null;

  if (token) {
    return token;
  }

  const { data: refreshData, error } = await supabase.auth.refreshSession();
  if (!error && refreshData.session?.access_token) {
    return refreshData.session.access_token;
  }

  return getCurrentAccessToken();
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
      const oauthCompleted = googleStatus === "connected" || Boolean(googleError);

      const token = await resolveAccessTokenAfterOAuth();

      if (!token) {
        const reason = oauthCompleted ? "session_expired" : "auth_required";
        if (active) {
          window.location.replace(buildLoginRedirect(destination, reason));
        }
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
        if (attempt < 2) {
          await new Promise((resolve) => window.setTimeout(resolve, 250));
        }
      }

      const bearerStatus = await fetchPlanifyAccessStatus(token);

      if (!active) return;

      if (!bearerStatus.authenticated) {
        window.location.replace(
          buildLoginRedirect(
            destination,
            oauthCompleted ? "session_expired" : "auth_required",
          ),
        );
        return;
      }

      if (!cookiesReady) {
        await ensurePremiumSessionCookies();
      }

      setMessage("Redirecionando…");
      notifyGoogleStatusChanged();
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
