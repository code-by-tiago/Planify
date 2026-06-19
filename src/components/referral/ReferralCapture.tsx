"use client";

import { useEffect } from "react";
import {
  normalizeReferralCode,
  REFERRAL_COOKIE,
  REFERRAL_COOKIE_MAX_AGE_DAYS,
} from "@/lib/referral/referral-client";

type ReferralCaptureProps = {
  referralCode?: string | null;
};

export function ReferralCapture({ referralCode }: ReferralCaptureProps) {
  useEffect(() => {
    const code = normalizeReferralCode(referralCode);
    if (!code) return;

    const maxAge = REFERRAL_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
    document.cookie = `${REFERRAL_COOKIE}=${encodeURIComponent(code)}; path=/; max-age=${maxAge}; samesite=lax`;
  }, [referralCode]);

  return null;
}
