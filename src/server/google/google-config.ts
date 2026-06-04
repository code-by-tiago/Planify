export const GOOGLE_OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/classroom.courses.readonly",
  "https://www.googleapis.com/auth/classroom.coursework.me",
] as const;

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
  return (
    String(process.env.GOOGLE_OAUTH_STATE_SECRET || "").trim() ||
    String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim() ||
    "planify-google-oauth-dev-only"
  );
}
