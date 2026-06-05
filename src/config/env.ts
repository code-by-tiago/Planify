export const envKeys = {
  supabaseUrl: "NEXT_PUBLIC_SUPABASE_URL",
  supabaseAnonKey: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  supabaseServiceRoleKey: "SUPABASE_SERVICE_ROLE_KEY",
  geminiApiKey: "GEMINI_API_KEY",
  geminiModelDefault: "GEMINI_MODEL_DEFAULT",
  geminiModelAdvanced: "GEMINI_MODEL_ADVANCED",
  stripeSecretKey: "STRIPE_SECRET_KEY",
  stripePublishableKey: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  stripeWebhookSecret: "STRIPE_WEBHOOK_SECRET",
  googleClientId: "GOOGLE_CLIENT_ID",
  googleClientSecret: "GOOGLE_CLIENT_SECRET",
  googleRedirectUri: "GOOGLE_REDIRECT_URI",
} as const;

export type EnvKey = keyof typeof envKeys;