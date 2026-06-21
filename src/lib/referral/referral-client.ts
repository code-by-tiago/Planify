export const REFERRAL_COOKIE = "planify_ref";
export const REFERRAL_COOKIE_MAX_AGE_DAYS = 30;

export function normalizeReferralCode(value: string | null | undefined): string | null {
  const code = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  return code.length >= 6 ? code.slice(0, 12) : null;
}

export function readReferralCookie(): string | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${REFERRAL_COOKIE}=`));

  if (!match) return null;

  const raw = decodeURIComponent(match.slice(REFERRAL_COOKIE.length + 1));
  return normalizeReferralCode(raw);
}
