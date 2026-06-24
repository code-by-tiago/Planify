import { getSupabaseBrowserClient } from "../supabase/browser-client";
import {
  checkPremiumAccess,
  clearPremiumAccessCookie,
  syncPremiumAccessCookie,
} from "./access-client";

const COOKIE_SYNC_COOLDOWN_MS = 12_000;
let cookieSyncInFlight: Promise<boolean> | null = null;
let lastCookieSyncAt = 0;

function decodeJwtEmail(token: string): string {
  try {
    const payload = token.split(".")[1];
    if (!payload) {
      return "";
    }
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(atob(normalized)) as { email?: string };
    return String(json.email || "").trim().toLowerCase();
  } catch {
    return "";
  }
}

function mightBeOwnerToken(token: string): boolean {
  const email = decodeJwtEmail(token);
  const ownerHint = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim().toLowerCase();
  return Boolean(ownerHint && email && email === ownerHint);
}

export function markPremiumCookiesSynced(): void {
  lastCookieSyncAt = Date.now();
}

async function runPremiumCookieSync(
  token: string,
  options?: { force?: boolean },
): Promise<boolean> {
  const force = options?.force === true;
  const now = Date.now();

  if (!force && cookieSyncInFlight) {
    return cookieSyncInFlight;
  }

  if (!force && now - lastCookieSyncAt < COOKIE_SYNC_COOLDOWN_MS) {
    return true;
  }

  const task = (async () => {
    try {
      const cookieResult = await syncPremiumAccessCookie(token);
      if (mightBeOwnerToken(token)) {
        await createOwnerSession(token).catch(() => null);
      }

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

      const synced = Boolean(
        cookieResult?.access?.authenticated || cookieResult?.success,
      );

      if (synced) {
        markPremiumCookiesSynced();
      }

      return synced;
    } catch {
      return false;
    }
  })();

  cookieSyncInFlight = task;

  try {
    return await task;
  } finally {
    if (cookieSyncInFlight === task) {
      cookieSyncInFlight = null;
    }
  }
}

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

  const { data, error } = await supabase.auth.signInWithPassword({
    email: params.email,
    password: params.password,
  });

  if (error || !data.session?.access_token) {
    return {
      success: false,
      premium: false,
      redirectTo: "/login",
      message: mapAuthErrorMessage(error?.message, error?.code),
    };
  }

  const accessToken = data.session.access_token;
  const ownerSessionPromise = mightBeOwnerToken(accessToken)
    ? createOwnerSession(accessToken)
    : Promise.resolve({
        success: false,
        isOwner: false,
        premium: false,
        email: "",
        message: "",
      });

  const [ownerSession, cookieResult] = await Promise.all([
    ownerSessionPromise,
    syncPremiumAccessCookie(accessToken).catch(() => null),
  ]);

  let premiumAuthenticated = Boolean(cookieResult?.access?.authenticated);
  let premiumAccess = Boolean(cookieResult?.access?.premium);
  let accessMessage =
    cookieResult?.access?.message ||
    "Não foi possível validar o acesso premium.";

  if (!premiumAuthenticated) {
    try {
      const fallbackAccess = await checkPremiumAccess(accessToken);
      premiumAuthenticated = Boolean(fallbackAccess.authenticated);
      premiumAccess = Boolean(fallbackAccess.premium);
      accessMessage = fallbackAccess.message || accessMessage;

      const cookiesSynced = await runPremiumCookieSync(accessToken, {
        force: true,
      });

      if (!cookiesSynced && premiumAuthenticated) {
        accessMessage =
          "Login realizado, mas não foi possível sincronizar a sessão. Tente novamente.";
        premiumAuthenticated = false;
      }
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
          accessToken,
        };
      }
    }
  } else {
    markPremiumCookiesSynced();
    if (mightBeOwnerToken(accessToken)) {
      await createOwnerSession(accessToken).catch(() => null);
    }
  }

  const ownerAccess = Boolean(ownerSession.success && ownerSession.isOwner);

  if (!premiumAuthenticated && !ownerAccess) {
    return {
      success: false,
      premium: false,
      redirectTo: "/login",
      message:
        accessMessage ||
        "Login realizado, mas o acesso premium não foi validado.",
      accessToken,
    };
  }

  const requirePremium = params.requirePremium !== false;
  const hasPremiumAccess = Boolean(premiumAccess || ownerAccess);

  if (requirePremium && !hasPremiumAccess) {
    return {
      success: true,
      premium: false,
      redirectTo: "/planos?premium=required",
      message: accessMessage || "Plano ativo não encontrado.",
      accessToken,
    };
  }

  return {
    success: true,
    premium: hasPremiumAccess,
    redirectTo: params.redirectTo || "/dashboard",
    message: ownerAccess
      ? "Acesso do proprietário liberado."
      : accessMessage || "Acesso liberado.",
    accessToken,
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

  return {
    success: false,
    premium: false,
    redirectTo: "/planos",
    message:
      "Assine o plano primeiro. Após o pagamento, crie sua senha na tela seguinte.",
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
      redirectTo: "/planos/ativar",
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

  return runPremiumCookieSync(token);
}
