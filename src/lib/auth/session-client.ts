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
      message: error?.message || "Não foi possível fazer login.",
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
    return {
      success: true,
      premium: false,
      needsEmailConfirmation: true,
      redirectTo: "/login?cadastro=confirmar",
      message:
        "Conta criada! Confirme o e-mail que enviamos e depois entre para escolher seu plano.",
    };
  }

  if (hasSession && data.session?.access_token) {
    await syncPremiumAccessCookie(data.session.access_token);
    await createOwnerSession(data.session.access_token);
  }

  return {
    success: true,
    premium: false,
    redirectTo: "/planos?cadastro=ok",
    message:
      "Conta criada! Na próxima tela, escolha Pro ou Premium para liberar os geradores IA.",
    accessToken: data.session?.access_token,
  };
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
