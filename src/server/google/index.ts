export const googleServerModule = {
  name: "google",
  status: "prepared",
  requiredEnv: [
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_REDIRECT_URI",
  ],
  scopes: [
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/classroom.coursework.me",
  ],
} as const;