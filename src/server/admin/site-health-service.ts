import { getGoogleConfigStatus } from "../google/google-config";
import { getOwnerEmails } from "../auth/owner-emails";

export type SiteHealthCheck = {
  id: string;
  label: string;
  status: "ok" | "warn" | "missing";
  detail: string;
};

export type SiteHealthReport = {
  checks: SiteHealthCheck[];
  featureFlags: Array<{ key: string; enabled: boolean; label: string }>;
  ownerConfigured: boolean;
  checkedAt: string;
};

function envPresent(key: string): boolean {
  return Boolean(String(process.env[key] || "").trim());
}

function envFlag(key: string, defaultOn = true): boolean {
  const raw = String(process.env[key] ?? (defaultOn ? "1" : "0"))
    .trim()
    .toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
}

export function fetchSiteHealthReport(): SiteHealthReport {
  const google = getGoogleConfigStatus();
  const ownerEmails = getOwnerEmails();

  const checks: SiteHealthCheck[] = [
    {
      id: "supabase",
      label: "Supabase",
      status:
        envPresent("NEXT_PUBLIC_SUPABASE_URL") &&
        envPresent("SUPABASE_SERVICE_ROLE_KEY")
          ? "ok"
          : "missing",
      detail: "URL pública + service role para operações server-side.",
    },
    {
      id: "owner",
      label: "Proprietário",
      status: ownerEmails.length > 0 ? "ok" : "missing",
      detail:
        ownerEmails.length > 0
          ? `${ownerEmails.length} e-mail(s) configurado(s).`
          : "Defina PLANIFY_OWNER_EMAIL ou PLANIFY_OWNER_EMAILS.",
    },
    {
      id: "google-oauth",
      label: "Google OAuth",
      status: google.configured ? "ok" : "warn",
      detail: google.configured
        ? "Client ID, secret e redirect URI configurados."
        : `Pendente: ${google.missing.join(", ") || "variáveis Google"}.`,
    },
    {
      id: "stripe",
      label: "Stripe",
      status:
        envPresent("STRIPE_SECRET_KEY") && envPresent("STRIPE_WEBHOOK_SECRET")
          ? "ok"
          : envPresent("STRIPE_SECRET_KEY")
            ? "warn"
            : "missing",
      detail: "Checkout e webhooks de assinatura.",
    },
    {
      id: "gemini",
      label: "Gemini IA",
      status: envPresent("GEMINI_API_KEY") ? "ok" : "warn",
      detail: envPresent("GEMINI_API_KEY")
        ? `Texto: ${process.env.GEMINI_MODEL_DEFAULT || process.env.GEMINI_MODEL || "padrão"} · Imagens: ${process.env.IMAGEN_MODEL || "imagen-4.0-fast-generate-001"}.`
        : "GEMINI_API_KEY não definida — gerações IA desativadas.",
    },
    {
      id: "node-env",
      label: "Ambiente",
      status: "ok",
      detail: `NODE_ENV=${process.env.NODE_ENV || "development"}.`,
    },
  ];

  const featureFlags = [
    {
      key: "GEMINI_CONTEXT_CACHE",
      enabled: envFlag("GEMINI_CONTEXT_CACHE", true),
      label: "Cache de contexto Gemini",
    },
    {
      key: "slide_images",
      enabled: envPresent("GEMINI_API_KEY"),
      label: "Imagens em slides (Gemini)",
    },
  ];

  return {
    checks,
    featureFlags,
    ownerConfigured: ownerEmails.length > 0,
    checkedAt: new Date().toISOString(),
  };
}
