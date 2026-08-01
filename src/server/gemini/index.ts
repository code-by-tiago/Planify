export const geminiServerModule = {
  name: "gemini",
  status: "prepared",
  requiredEnv: ["GEMINI_API_KEY"],
  defaultModel: "gemini-2.5-flash",
} as const;