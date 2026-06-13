import { getSupabaseBrowserClient } from "../supabase/browser-client";
import {
  clearPremiumAccessCookie,
  syncPremiumAccessCookie,
} from "./access-client";

export type LoginResult = {
  success: boolean;
  premium: boolean;
  redirectTo: string;
  message: string;
  accessToken?: string;
  /** Conta criada, mas Supabase exige confirmação de e-mail antes do login */
  needsEmailConfirmation?: boolean;
};

function timeout(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function mapAuthErrorMessage(
  message: string | undefined,
  code: string | undefined,
): string {
  const normalized = String(message || "").toLowerCase();

  if (
    code === "email_not_confirmed" ||
    normalized.includes("email not confirmed")
  ) {
    return "Confirme seu e-mail antes de entrar. Verifique a caixa de entrada e o spam.";
  }

  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("invalid credentials")
  ) {
    return "E-mail ou senha incorretos. Use o mesmo e-mail do pagamento ou redefina sua senha abaixo.";
  }

  if (normalized.includes("rate limit") || normalized.includes("rate_limit")) {
    return "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo na tela de ativação após o pagamento.";
  }

  return message || "Não foi possível fazer login.";
}

export async function requestPasswordReset(email: string): Promise<{
  success: boolean;
  message: string;
}> {
  const supabase = getSupabaseBrowserClient();
  const redirectTo = `${window.location.origin}/login`;

  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo,
  });

  if (error) {
    return {
      success: false,
      message: mapAuthErrorMessage(error.message, error.code),
    };
  }

  return {
    success: true,
    message:
      "Enviamos um link para redefinir sua senha. Verifique seu e-mail (e o spam).",
  };
}

export async function createOwnerSession(accessToken: string) {
  const response = await fetch("/api/owner/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ accessToken }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    return {
      success: false,
      isOwner: false,
      premium: false,
      email: "",
      message:
        data?.error?.message ||
        "Esta conta não é o proprietário do Planify.",
    };
  }

  return {
    success: true,
    isOwner: Boolean(data?.isOwner),
    premium: Boolean(data?.premium),
    email: String(data?.email || ""),
    message: "Acesso do proprietário liberado.",
  };
}

export async function clearOwnerSession() {
  await fetch("/api/owner/session", {
    method: "DELETE",
    credentials: "include",
  });
}

export async function signInAndSyncPremiumAccess(params: {
  email: string;
  password: string;
  redirectTo?: string;
  requirePremium?: boolean;
}): Promise<LoginResult> {
  const supabase = getSupabaseBrowserClient();
  const emailDomain = params.email.split("@")[1] || "unknown";

  const { data, error } = await supabase.auth.signInWithPassword({
    email: params.email,
    password: params.password,
  });

  // #region agent log
  fetch("http://127.0.0.1:7616/ingest/e1530077-9aac-4460-b700-4c831c23c281", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "3ed578",
    },
    body: JSON.stringify({
      sessionId: "3ed578",
      runId: "checkout-debug",
      hypothesisId: "H3-H4",
      location: "session-client.ts:signIn:afterSignIn",
      message: "signInWithPassword result",
      data: {
        emailDomain,
        hasSession: Boolean(data.session?.access_token),
        errorStatus: error?.status ?? null,
        errorCode: error?.code ?? null,
        errorMessage: error?.message ?? null,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  if (error || !data.session?.access_token) {
    return {
      success: false,
      premium: false,
      redirectTo: "/login",
      message: mapAuthErrorMessage(error?.message, error?.code),
    };
  }

  const ownerSession = await createOwnerSession(data.session.access_token);
  let cookieResult: Awaited<ReturnType<typeof syncPremiumAccessCookie>> | null = null;

  try {
    cookieResult = await syncPremiumAccessCookie(data.session.access_token);
  } catch (syncError) {
    if (!ownerSession.success) {
      return {
        success: false,
        premium: false,
        redirectTo: "/login",
        message:
          syncError instanceof Error
            ? syncError.message
            : "Não foi possível validar o acesso premium.",
        accessToken: data.session.access_token,
      };
    }
  }

  const premiumAuthenticated = Boolean(cookieResult?.access.authenticated);
  const premiumAccess = Boolean(cookieResult?.access.premium);
  const ownerAccess = Boolean(ownerSession.success && ownerSession.isOwner);

  if (!premiumAuthenticated && !ownerAccess) {
    return {
      success: false,
      premium: false,
      redirectTo: "/login",
      message:
        cookieResult?.access.message ||
        "Login realizado, mas o acesso premium não foi validado.",
      accessToken: data.session.access_token,
    };
  }

  const requirePremium = params.requirePremium !== false;
  const hasPremiumAccess = Boolean(premiumAccess || ownerAccess);

  // #region agent log
  fetch("http://127.0.0.1:7616/ingest/e1530077-9aac-4460-b700-4c831c23c281", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "3ed578",
    },
    body: JSON.stringify({
      sessionId: "3ed578",
      runId: "checkout-debug",
      hypothesisId: "H1-H2",
      location: "session-client.ts:signIn:afterCookieSync",
      message: "premium access after login",
      data: {
        emailDomain,
        premiumAuthenticated,
        premiumAccess,
        ownerAccess,
        hasPremiumAccess,
        requirePremium,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  if (requirePremium && !hasPremiumAccess) {
    return {
      success: true,
      premium: false,
      redirectTo: "/planos?premium=required",
      message: cookieResult?.access.message || "Plano ativo não encontrado.",
      accessToken: data.session.access_token,
    };
  }

  return {
    success: true,
    premium: hasPremiumAccess,
    redirectTo: params.redirectTo || "/dashboard",
    message: ownerAccess
      ? "Acesso do proprietário liberado."
      : cookieResult?.access.message || "Acesso liberado.",
    accessToken: data.session.access_token,
  };
}

export async function signUpAndGoToPlans(params: {
  email: string;
  password: string;
  fullName?: string;
}): Promise<LoginResult> {
  try {
    const statusResponse = await fetch("/api/public/registrations-status", {
      cache: "no-store",
    });
    const statusJson = await statusResponse.json().catch(() => null);

    if (statusJson?.success && statusJson.registrationsEnabled === false) {
      return {
        success: false,
        premium: false,
        redirectTo: "/login",
        message:
          "Novos cadastros estão temporariamente suspensos. Tente novamente mais tarde ou entre em contato com o suporte.",
      };
    }
  } catch {
    // Se o endpoint falhar, não bloqueia cadastro legado.
  }

  const normalizedEmail = params.email.trim();
  const statusRes = await fetch(
    `/api/public/checkout-account-status?email=${encodeURIComponent(normalizedEmail)}`,
    { cache: "no-store" },
  );
  const statusJson = await statusRes.json().catch(() => null);

  if (
    statusJson?.data?.hasActiveSubscription &&
    !statusJson?.data?.hasAccount
  ) {
    return activateAccountAfterPayment({
      email: normalizedEmail,
      password: params.password,
    });
  }

  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: {
        full_name: params.fullName || "",
      },
    },
  });

  if (error) {
    return {
      success: false,
      premium: false,
      redirectTo: "/login",
      message: error.message,
    };
  }

  const hasSession = Boolean(data.session?.access_token);

  if (data.user && !hasSession) {
    // #region agent log
    fetch("http://127.0.0.1:7616/ingest/e1530077-9aac-4460-b700-4c831c23c281", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "3ed578",
      },
      body: JSON.stringify({
        sessionId: "3ed578",
        runId: "checkout-debug",
        hypothesisId: "H5",
        location: "session-client.ts:signUp:needsConfirmation",
        message: "signup requires email confirmation",
        data: {
          emailDomain: params.email.split("@")[1] || "unknown",
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    return {
      success: true,
      premium: false,
      needsEmailConfirmation: true,
      redirectTo: "/login?cadastro=confirmar",
      message:
        "Conta criada! Confirme o e-mail que enviamos. Se você já pagou, o plano será liberado automaticamente ao entrar.",
    };
  }

  if (hasSession && data.session?.access_token) {
    const cookieResult = await syncPremiumAccessCookie(data.session.access_token);
    await createOwnerSession(data.session.access_token);

    if (cookieResult.access.premium) {
      return {
        success: true,
        premium: true,
        redirectTo: "/dashboard",
        message: "Conta criada e plano vinculado! Bem-vindo ao Planify.",
        accessToken: data.session.access_token,
      };
    }
  }

  return {
    success: true,
    premium: false,
    redirectTo: "/planos?cadastro=ok",
    message:
      "Conta criada! Na próxima tela, assine o plano Professor para liberar os geradores IA.",
    accessToken: data.session?.access_token,
  };
}

/** Pós-pagamento: cria senha ou entra com conta existente e libera o plano. */
export async function activateAccountAfterPayment(params: {
  email: string;
  password: string;
  sessionId?: string | null;
}): Promise<LoginResult> {
  const email = params.email.trim();
  const password = params.password;

  const statusRes = await fetch(
    `/api/public/checkout-account-status?email=${encodeURIComponent(email)}`,
    { cache: "no-store" },
  );
  const statusJson = await statusRes.json().catch(() => null);
  const hasAccount = Boolean(statusJson?.data?.hasAccount);

  // #region agent log
  fetch("http://127.0.0.1:7616/ingest/e1530077-9aac-4460-b700-4c831c23c281", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "3ed578",
    },
    body: JSON.stringify({
      sessionId: "3ed578",
      runId: "checkout-activate",
      hypothesisId: "H1-H6",
      location: "session-client.ts:activateAccountAfterPayment:start",
      message: "post-payment activation start",
      data: {
        emailDomain: email.split("@")[1] || "unknown",
        hasAccount,
        hasActiveSubscription: Boolean(statusJson?.data?.hasActiveSubscription),
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  if (hasAccount) {
    return signInAndSyncPremiumAccess({
      email,
      password,
      redirectTo: "/dashboard",
      requirePremium: false,
    });
  }

  const activateRes = await fetch("/api/stripe/activate-account", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      sessionId: params.sessionId || undefined,
    }),
  });

  const activateJson = await activateRes.json().catch(() => null);

  // #region agent log
  fetch("http://127.0.0.1:7616/ingest/e1530077-9aac-4460-b700-4c831c23c281", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "3ed578",
    },
    body: JSON.stringify({
      sessionId: "3ed578",
      runId: "checkout-activate",
      hypothesisId: "H6",
      location: "session-client.ts:activateAccountAfterPayment:serverActivate",
      message: "server-side account activation result",
      data: {
        httpStatus: activateRes.status,
        success: Boolean(activateJson?.success),
        errorCode: activateJson?.error?.code ?? null,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  if (activateJson?.error?.code === "account_exists") {
    return signInAndSyncPremiumAccess({
      email,
      password,
      redirectTo: "/dashboard",
      requirePremium: false,
    });
  }

  if (!activateRes.ok || !activateJson?.success) {
    return {
      success: false,
      premium: false,
      redirectTo: "/planos/sucesso",
      message:
        activateJson?.error?.message ||
        "Não foi possível criar sua conta. Tente novamente em instantes.",
    };
  }

  return signInAndSyncPremiumAccess({
    email,
    password,
    redirectTo: "/dashboard",
    requirePremium: false,
  });
}

export async function createAdminSession(accessToken: string) {
  const response = await fetch("/api/admin/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ accessToken }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message || "Não foi possível criar sessão administrativa.",
    );
  }

  return data as {
    success: boolean;
    authenticated: boolean;
    isAdmin: boolean;
    email: string;
  };
}

export async function clearAdminSession() {
  await fetch("/api/admin/session", {
    method: "DELETE",
    credentials: "include",
  });
}

/** Remove caches locais do Planify e tokens Supabase persistidos no navegador. */
export function clearPlanifyClientStorage(): void {
  if (typeof window === "undefined") {
    return;
  }

  const sessionKeys = [
    "planify_admin_tab_unlocked",
    "planify-invite-sync-warning",
    "planify-studio-tema",
    "planify-studio-objetivo-hint",
  ];

  for (const key of sessionKeys) {
    try {
      window.sessionStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }

  try {
    const keysToRemove: string[] = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (
        key &&
        (key.startsWith("sb-") ||
          key.startsWith("planify_") ||
          key.startsWith("planify-"))
      ) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      window.localStorage.removeItem(key);
    }
  } catch {
    /* ignore */
  }
}

export async function signOutPlanify(): Promise<void> {
  const supabase = getSupabaseBrowserClient();

  await Promise.allSettled([
    supabase.auth.signOut({ scope: "local" }),
    clearPremiumAccessCookie(),
    clearAdminSession(),
    clearOwnerSession(),
  ]);

  clearPlanifyClientStorage();
}

export async function getCurrentAccessToken(): Promise<string | null> {
  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase.auth.getSession();

  return data.session?.access_token || null;
}

/** Renova cookies httpOnly quando o Supabase ainda tem sessão ativa. */
export async function ensurePremiumSessionCookies(): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    return false;
  }

  try {
    const cookieResult = await syncPremiumAccessCookie(token);
    await createOwnerSession(token);

    if (cookieResult.inviteSyncWarning) {
      try {
        sessionStorage.setItem(
          "planify-invite-sync-warning",
          cookieResult.inviteSyncWarning,
        );
      } catch {
        /* ignore */
      }
    }

    return Boolean(
      cookieResult?.access?.authenticated || cookieResult?.success,
    );
  } catch {
    return false;
  }
}
