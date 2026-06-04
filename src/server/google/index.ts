export { GOOGLE_OAUTH_SCOPES, getGoogleConfigStatus } from "./google-config";
export { exportMaterialToGoogle } from "./google-export-service";

export const googleServerModule = {
  name: "google",
  status: "active",
  requiredEnv: [
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_REDIRECT_URI",
  ],
  scopes: [
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/classroom.courses.readonly",
    "https://www.googleapis.com/auth/classroom.coursework.me",
  ],
  docs: "docs/google/CONFIGURAR-GOOGLE-CLOUD.md",
} as const;