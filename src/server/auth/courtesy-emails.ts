import { isOwnerEmail } from "./owner-emails";

/**
 * Contas com acesso cortesia ilimitado (sem débito de créditos nem cota diária).
 * Não concede privilégios de admin — apenas bypass de quotas de geração.
 *
 * Configure via PLANIFY_COURTESY_EMAILS (vírgula) e/ou lista embutida abaixo.
 */
const BUILTIN_COURTESY_EMAILS = [
  "cristiane-ggwerberich@educar.rs.gov.br",
] as const;

export function getCourtesyEmails(): string[] {
  const fromEnv = [
    process.env.PLANIFY_COURTESY_EMAILS,
    process.env.COURTESY_EMAILS,
  ]
    .join(",")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return [...new Set([...BUILTIN_COURTESY_EMAILS, ...fromEnv])];
}

export function isCourtesyEmail(email: string | null | undefined): boolean {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized) return false;
  return getCourtesyEmails().includes(normalized);
}

/** Owners e contas cortesia não têm limites de créditos nem gerações profundas diárias. */
export function hasUnlimitedQuota(email: string | null | undefined): boolean {
  return isOwnerEmail(email) || isCourtesyEmail(email);
}
