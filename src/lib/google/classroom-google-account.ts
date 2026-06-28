export const EDUCAR_GOOGLE_DOMAIN = "educar.rs.gov.br";

export const CLASSROOM_GOOGLE_EMAIL_STORAGE_KEY = "planify-classroom-google-email";

export function normalizeGoogleEmail(value: string | null | undefined): string {
  return String(value || "").trim().toLowerCase();
}

export function isEducarInstitutionalEmail(email: string | null | undefined): boolean {
  const normalized = normalizeGoogleEmail(email);
  return normalized.endsWith(`@${EDUCAR_GOOGLE_DOMAIN}`);
}

export function isValidGoogleEmail(email: string | null | undefined): boolean {
  const normalized = normalizeGoogleEmail(email);
  if (!normalized.includes("@")) return false;
  const [local, domain] = normalized.split("@");
  return Boolean(local && domain && domain.includes("."));
}

export function extractEmailDomain(email: string): string | null {
  const normalized = normalizeGoogleEmail(email);
  const at = normalized.lastIndexOf("@");
  if (at < 0) return null;
  const domain = normalized.slice(at + 1);
  return domain || null;
}

export function resolveClassroomOAuthHint(email: string): {
  loginHint: string;
  hostedDomain?: string;
} {
  const loginHint = normalizeGoogleEmail(email);
  const domain = extractEmailDomain(loginHint);

  if (domain === EDUCAR_GOOGLE_DOMAIN) {
    return { loginHint, hostedDomain: EDUCAR_GOOGLE_DOMAIN };
  }

  return { loginHint };
}

/** Parâmetros OAuth do Classroom — sempre prioriza domínio educar e login_hint quando disponível. */
export function resolveClassroomOAuthParams(options: {
  institutionalEmail?: string | null;
  planifyEmail?: string | null;
}): {
  loginHint?: string;
  hostedDomain: string;
} {
  const candidates = [options.institutionalEmail, options.planifyEmail]
    .map(normalizeGoogleEmail)
    .filter(isValidGoogleEmail);

  const educarEmail = candidates.find(isEducarInstitutionalEmail);
  const loginHint = educarEmail || candidates[0];

  return {
    ...(loginHint ? { loginHint } : {}),
    hostedDomain: EDUCAR_GOOGLE_DOMAIN,
  };
}

/** Google OAuth ainda não conectado no Planify (independe do login Supabase). */
export function needsClassroomGoogleOAuth(
  status: { connected: boolean; googleEmail: string | null } | null | undefined,
): boolean {
  return !status?.connected;
}

/** Token Google conectado, mas não é a conta institucional da escola. */
export function classroomGoogleAccountNeedsSwitch(
  status: { connected: boolean; googleEmail: string | null } | null | undefined,
): boolean {
  if (!status?.connected) return false;
  if (classroomGoogleAccountIncomplete(status)) return true;
  return classroomGoogleAccountMismatch(status.googleEmail);
}

/** Conectado ao Google mas sem e-mail resolvido no token (estado inconsistente). */
export function classroomGoogleAccountIncomplete(
  status: { connected: boolean; googleEmail: string | null } | null | undefined,
): boolean {
  return Boolean(status?.connected && !normalizeGoogleEmail(status.googleEmail));
}

/** Precisa conectar ou trocar para conta @educar antes de listar turmas. */
export function needsEducarClassroomConnect(
  status: { connected: boolean; googleEmail: string | null } | null | undefined,
): boolean {
  return (
    needsClassroomGoogleOAuth(status) ||
    classroomGoogleAccountNeedsSwitch(status)
  );
}

/** Pronto para exportar: token Google com e-mail @educar.rs.gov.br. */
export function isClassroomExportReady(
  status: { connected: boolean; googleEmail: string | null } | null | undefined,
): boolean {
  return Boolean(status?.connected && isEducarInstitutionalEmail(status.googleEmail));
}

export function suggestInstitutionalEmail(
  planifyEmail: string | null | undefined,
  savedEmail: string | null | undefined,
): string {
  const saved = normalizeGoogleEmail(savedEmail);
  if (saved && isValidGoogleEmail(saved)) {
    return saved;
  }

  const planify = normalizeGoogleEmail(planifyEmail);
  if (planify && isEducarInstitutionalEmail(planify)) {
    return planify;
  }

  return saved || planify;
}

export function classroomGoogleAccountMismatch(
  googleEmail: string | null | undefined,
): boolean {
  const normalized = normalizeGoogleEmail(googleEmail);
  if (!normalized) return false;
  return !isEducarInstitutionalEmail(normalized);
}

export function persistClassroomGoogleEmail(email: string): void {
  try {
    sessionStorage.setItem(
      CLASSROOM_GOOGLE_EMAIL_STORAGE_KEY,
      normalizeGoogleEmail(email),
    );
  } catch {
    /* ignore */
  }
}

export function readClassroomGoogleEmail(): string {
  try {
    return normalizeGoogleEmail(
      sessionStorage.getItem(CLASSROOM_GOOGLE_EMAIL_STORAGE_KEY),
    );
  } catch {
    return "";
  }
}
