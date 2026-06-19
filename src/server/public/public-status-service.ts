import { getGoogleConfigStatus } from "../google/google-config";

export type PublicServiceStatus = "operational" | "degraded" | "unavailable";

export type PublicStatusCheck = {
  id: string;
  label: string;
  status: PublicServiceStatus;
  message: string;
};

export type PublicStatusReport = {
  overall: PublicServiceStatus;
  headline: string;
  checks: PublicStatusCheck[];
  checkedAt: string;
};

function envPresent(key: string): boolean {
  return Boolean(String(process.env[key] || "").trim());
}

function resolveOverall(checks: PublicStatusCheck[]): PublicServiceStatus {
  if (checks.some((check) => check.status === "unavailable")) {
    return "unavailable";
  }
  if (checks.some((check) => check.status === "degraded")) {
    return "degraded";
  }
  return "operational";
}

function overallHeadline(status: PublicServiceStatus): string {
  if (status === "operational") {
    return "Serviços operacionais";
  }
  if (status === "degraded") {
    return "Alguns serviços com instabilidade";
  }
  return "Serviços parcialmente indisponíveis";
}

export function fetchPublicStatusReport(): PublicStatusReport {
  const google = getGoogleConfigStatus();
  const geminiConfigured = envPresent("GEMINI_API_KEY");
  const supabaseConfigured =
    envPresent("NEXT_PUBLIC_SUPABASE_URL") &&
    envPresent("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  const checks: PublicStatusCheck[] = [
    {
      id: "ai",
      label: "Geração com IA",
      status: geminiConfigured ? "operational" : "unavailable",
      message: geminiConfigured
        ? "Motor Gemini configurado. Em picos de uso, a cota diária pode limitar gerações profundas."
        : "A IA está temporariamente indisponível. Materiais em cache e exportações locais continuam acessíveis.",
    },
    {
      id: "auth",
      label: "Autenticação",
      status: supabaseConfigured ? "operational" : "unavailable",
      message: supabaseConfigured
        ? "Login de professores operacional."
        : "Autenticação indisponível no momento. Tente novamente em instantes.",
    },
    {
      id: "export",
      label: "Exportação",
      status: geminiConfigured && google.configured ? "operational" : "degraded",
      message:
        geminiConfigured && google.configured
          ? "Exportação DOCX/PDF e integração Google Docs disponíveis."
          : "Exportação local (DOCX/PDF) disponível. Integração Google pode exigir reconexão.",
    },
  ];

  const overall = resolveOverall(checks);

  return {
    overall,
    headline: overallHeadline(overall),
    checks,
    checkedAt: new Date().toISOString(),
  };
}
