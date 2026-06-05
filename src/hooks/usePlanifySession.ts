"use client";

import { useEffect, useState } from "react";
import {
  formatDisplayNameFromEmail,
  formatPlanLabel,
} from "@/lib/auth/format-plan-label";

export type PlanifySession = {
  loading: boolean;
  authenticated: boolean;
  premium: boolean;
  email: string;
  displayName: string;
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
        const response = await fetch("/api/access/status", {
          cache: "no-store",
          credentials: "include",
        });
        const data = (await response.json().catch(() => null)) as {
          authenticated?: boolean;
          premium?: boolean;
          email?: string;
          isAdmin?: boolean;
          isOwner?: boolean;
          planKey?: string | null;
        } | null;

        if (!active) return;

        const email = data?.email || "";
        setSession({
          loading: false,
          authenticated: Boolean(data?.authenticated),
          premium: Boolean(data?.premium),
          email,
          displayName: email
            ? formatDisplayNameFromEmail(email)
            : "Professora",
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
