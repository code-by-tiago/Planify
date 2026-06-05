/** E-mails com acesso owner/admin — somente variáveis de ambiente (nunca hardcoded). */
export function getOwnerEmails(): string[] {
  return [
    process.env.PLANIFY_ADMIN_EMAIL,
    process.env.ADMIN_EMAIL,
    process.env.NEXT_PUBLIC_ADMIN_EMAIL,
    process.env.PLANIFY_OWNER_EMAIL,
    process.env.OWNER_EMAIL,
    process.env.PLANIFY_OWNER_EMAILS,
  ]
    .join(",")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isOwnerEmail(email: string | null | undefined): boolean {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized) return false;
  return getOwnerEmails().includes(normalized);
}
