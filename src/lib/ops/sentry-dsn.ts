/** Resolve Sentry DSN from server or public env (client-safe when NEXT_PUBLIC_*). */
export function getSentryDsn(): string | undefined {
  const dsn =
    process.env.SENTRY_DSN?.trim() ||
    process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
  return dsn || undefined;
}
