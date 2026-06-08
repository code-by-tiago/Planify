"use client";

import { useEffect, useState } from "react";
import {
  formatDisplayNameFromEmail,
  formatPlanLabel,
} from "@/lib/auth/format-plan-label";
import { ensurePremiumSessionCookies } from "@/lib/auth/session-client";

export type PlanifySession = {
  loading: boolean;
  authenticated: boolean;
  premium: boolean;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  planLabel: string;
  isAdmin: boolean;
  isOwner: boolean;
};

const initial: PlanifySession = {
  loading: true,
  authenticated: false,
  premium: false,
  email: "",
  displayName: "",
  avatarUrl: null,
  planLabel: "",
  isAdmin: false,
  isOwner: false,
};

export function usePlanifySession() {
  const [session, setSession] = useState<PlanifySession>(initial);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        await ensurePremiumSessionCookies();

        const response = await fetch("/api/access/status", {
          cache: "no-store",
          credentials: "include",
        });
        const data = (await response.json().catch(() => null)) as {
          authenticated?: boolean;
          premium?: boolean;
          email?: string;
          displayName?: string;
          avatarUrl?: string | null;
          isAdmin?: boolean;
          isOwner?: boolean;
          planKey?: string | null;
        } | null;

        if (!active) return;

        const email = data?.email || "";
        const displayName =
          typeof data?.displayName === "string" && data.displayName.trim()
            ? data.displayName.trim()
            : email
              ? formatDisplayNameFromEmail(email)
              : "Professora";
        const avatarUrl =
          typeof data?.avatarUrl === "string" && data.avatarUrl.trim()
            ? data.avatarUrl.trim()
            : null;

        setSession({
          loading: false,
          authenticated: Boolean(data?.authenticated),
          premium: Boolean(data?.premium),
          email,
          displayName,
          avatarUrl,
          planLabel: formatPlanLabel(data?.planKey, {
            isAdmin: data?.isAdmin,
            isOwner: data?.isOwner,
          }),
          isAdmin: Boolean(data?.isAdmin),
          isOwner: Boolean(data?.isOwner),
        });
      } catch {
        if (!active) return;
        setSession({ ...initial, loading: false });
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  return session;
}
