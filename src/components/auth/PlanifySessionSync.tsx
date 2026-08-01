"use client";

import { useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { ensurePremiumSessionCookies } from "@/lib/auth/session-client";

/**
 * Keeps httpOnly access cookies aligned with the Supabase browser session.
 */
export function PlanifySessionSync() {
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    void ensurePremiumSessionCookies();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        event === "INITIAL_SESSION" ||
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED"
      ) {
        if (session?.access_token) {
          void ensurePremiumSessionCookies();
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
