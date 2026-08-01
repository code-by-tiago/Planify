export const stripeServerModule = {
  name: "stripe",
  status: "prepared",
  requiredEnv: [
    "STRIPE_SECRET_KEY",
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    "STRIPE_WEBHOOK_SECRET",
  ],
} as const;