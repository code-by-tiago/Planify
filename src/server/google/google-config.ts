export const GOOGLE_DRIVE_FILE_SCOPE =
  "https://www.googleapis.com/auth/drive.file";
export const GOOGLE_USERINFO_EMAIL_SCOPE =
  "https://www.googleapis.com/auth/userinfo.email";
export const GOOGLE_FORMS_SCOPE = "https://www.googleapis.com/auth/forms.body";
export const GOOGLE_CLASSROOM_COURSES_READONLY_SCOPE =
  "https://www.googleapis.com/auth/classroom.courses.readonly";
export const GOOGLE_CLASSROOM_COURSEWORK_MATERIALS_SCOPE =
  "https://www.googleapis.com/auth/classroom.courseworkmaterials";
export const GOOGLE_CLASSROOM_COURSEWORK_STUDENTS_SCOPE =
  "https://www.googleapis.com/auth/classroom.coursework.students";

export const GOOGLE_CLASSROOM_COURSES_SCOPES = [
  GOOGLE_CLASSROOM_COURSES_READONLY_SCOPE,
] as const;

export const GOOGLE_CLASSROOM_REQUIRED_SCOPES = [
  GOOGLE_DRIVE_FILE_SCOPE,
  GOOGLE_CLASSROOM_COURSES_READONLY_SCOPE,
  GOOGLE_CLASSROOM_COURSEWORK_MATERIALS_SCOPE,
  GOOGLE_CLASSROOM_COURSEWORK_STUDENTS_SCOPE,
] as const;

export const GOOGLE_OAUTH_SCOPES = [
  "openid",
  "email",
  GOOGLE_USERINFO_EMAIL_SCOPE,
  GOOGLE_DRIVE_FILE_SCOPE,
  GOOGLE_FORMS_SCOPE,
  GOOGLE_CLASSROOM_COURSES_READONLY_SCOPE,
  GOOGLE_CLASSROOM_COURSEWORK_MATERIALS_SCOPE,
  GOOGLE_CLASSROOM_COURSEWORK_STUDENTS_SCOPE,
] as const;

export function hasGoogleScope(
  scopes: readonly string[],
  requiredScope: string,
): boolean {
  return scopes.some((scope) => scope === requiredScope);
}

export function resolveMissingGoogleScopes(
  scopes: readonly string[],
  requiredScopes: readonly string[],
): string[] {
  return requiredScopes.filter((scope) => !hasGoogleScope(scopes, scope));
}

export function hasRequiredGoogleClassroomScopes(
  scopes: readonly string[],
): boolean {
  return resolveMissingGoogleScopes(
    scopes,
    GOOGLE_CLASSROOM_REQUIRED_SCOPES,
  ).length === 0;
}

export function hasGoogleFormsScope(scopes: readonly string[]): boolean {
  return scopes.some(
    (scope) => scope === GOOGLE_FORMS_SCOPE || scope.includes("forms.body"),
  );
}

export type GoogleConfigStatus = {
  configured: boolean;
  missing: string[];
};

export function getGoogleConfigStatus(): GoogleConfigStatus {
  const required = [
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_REDIRECT_URI",
  ] as const;

  const missing = required.filter((key) => !String(process.env[key] || "").trim());

  return {
    configured: missing.length === 0,
    missing: [...missing],
  };
}

export function requireGoogleConfig(): {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  driveFolderId: string | null;
} {
  const status = getGoogleConfigStatus();

  if (!status.configured) {
    throw new Error(
      `Google OAuth não configurado. Defina: ${status.missing.join(", ")}`,
    );
  }

  return {
    clientId: String(process.env.GOOGLE_CLIENT_ID).trim(),
    clientSecret: String(process.env.GOOGLE_CLIENT_SECRET).trim(),
    redirectUri: String(process.env.GOOGLE_REDIRECT_URI).trim(),
    driveFolderId: String(process.env.GOOGLE_DRIVE_FOLDER_ID || "").trim() || null,
  };
}

export function getGoogleOAuthStateSecret(): string {
  const secret = String(process.env.GOOGLE_OAUTH_STATE_SECRET || "").trim();

  if (process.env.NODE_ENV === "production" && !secret) {
    throw new Error(
      "GOOGLE_OAUTH_STATE_SECRET é obrigatório em produção. Defina no ambiente da Vercel.",
    );
  }

  if (secret) {
    return secret;
  }

  const serviceRole = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (serviceRole) {
    return serviceRole;
  }

  return "planify-google-oauth-dev-only";
}
