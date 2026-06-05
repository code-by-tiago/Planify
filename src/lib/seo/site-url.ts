export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (explicit) {
    return explicit.replace(/\/$/, "");
  }

  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();

  if (vercelHost) {
    return `https://${vercelHost.replace(/\/$/, "")}`;
  }

  return "https://www.iaplanify.com.br";
}
