import { createHash } from "node:crypto";
import { getSupabaseAdminClient } from "../supabase/admin-client";
import { getSiteUrl } from "@/lib/seo/site-url";
import { normalizeReferralCode } from "@/lib/referral/referral-client";

export { REFERRAL_COOKIE, REFERRAL_COOKIE_MAX_AGE_DAYS, normalizeReferralCode } from "@/lib/referral/referral-client";

export function deriveReferralCode(userId: string): string {
  const hash = createHash("sha256").update(userId).digest("hex").toUpperCase();
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  for (let index = 0; index < 8; index += 1) {
    const byte = parseInt(hash.slice(index * 2, index * 2 + 2), 16);
    code += alphabet[byte % alphabet.length];
  }

  return code;
}

export function buildReferralSignupPath(code: string): string {
  return `/cadastro?ref=${encodeURIComponent(code)}`;
}

export function buildReferralSignupUrl(code: string): string {
  return `${getSiteUrl()}${buildReferralSignupPath(code)}`;
}

export async function ensureProfileReferralCode(userId: string): Promise<string> {
  const supabase = getSupabaseAdminClient();
  const fallback = deriveReferralCode(userId);

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("referral_code")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const existing = normalizeReferralCode(profile?.referral_code);
  if (existing) return existing;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ referral_code: fallback })
    .eq("id", userId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return fallback;
}

export async function resolveReferrerIdByCode(
  code: string | null | undefined,
): Promise<string | null> {
  const normalized = normalizeReferralCode(code);
  if (!normalized) return null;

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("referral_code", normalized)
    .maybeSingle();

  if (error || !data?.id) {
    return null;
  }

  return data.id;
}

export async function recordTeacherReferral(options: {
  referredUserId: string;
  referralCode: string | null | undefined;
}): Promise<{ recorded: boolean; referrerId?: string }> {
  const normalized = normalizeReferralCode(options.referralCode);
  if (!normalized) return { recorded: false };

  const referrerId = await resolveReferrerIdByCode(normalized);
  if (!referrerId || referrerId === options.referredUserId) {
    return { recorded: false };
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("teacher_referrals").insert({
    referrer_id: referrerId,
    referred_id: options.referredUserId,
    referral_code: normalized,
  });

  if (error) {
    if (error.code === "23505") {
      return { recorded: false, referrerId };
    }
    throw new Error(error.message);
  }

  return { recorded: true, referrerId };
}

export async function fetchReferralSummary(userId: string): Promise<{
  code: string;
  signupUrl: string;
  referralCount: number;
}> {
  const code = await ensureProfileReferralCode(userId);
  const supabase = getSupabaseAdminClient();

  const { count, error } = await supabase
    .from("teacher_referrals")
    .select("id", { count: "exact", head: true })
    .eq("referrer_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return {
    code,
    signupUrl: buildReferralSignupUrl(code),
    referralCount: count ?? 0,
  };
}
