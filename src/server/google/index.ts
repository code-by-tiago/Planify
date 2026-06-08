export { GOOGLE_OAUTH_SCOPES, getGoogleConfigStatus } from "./google-config";
export { exportMaterialToGoogle } from "./google-export-service";
export { exportSlidesToGooglePresentations } from "./google-slides-export-service";
export {
  exportDocumentToGoogleDocs,
  saveDocumentToGoogleDrive,
} from "./google-docs-export-service";
export { exportQuizToGoogleForms } from "./google-forms-export-service";

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
    "https://www.googleapis.com/auth/forms.body",
  ],
  docs: "docs/google/CONFIGURAR-GOOGLE-CLOUD.md",
} as const;