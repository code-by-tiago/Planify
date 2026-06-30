"use client";

import { useEffect, useState } from "react";
import type { AccessTier } from "@/lib/bncc/access";
import type { SchoolMembershipRole } from "@/types/school";
import { fetchFullPlanifyAccessStatus } from "@/lib/auth/access-client";
import { ensurePremiumSessionCookies } from "@/lib/auth/session-client";

export type PlanifyExtendedAccess = {
  loading: boolean;
  authenticated: boolean;
  premium: boolean;
  email: string;
  planKey: string | null;
  tier: AccessTier;
  profileRole: string;
  schoolId: string | null;
  schoolMembershipRole: SchoolMembershipRole | null;
  hasSchoolMembership: boolean;
  isSchoolManager: boolean;
  isDirector: boolean;
  isManagerView: boolean;
  canViewBnccProgress: boolean;
  canViewDirectorPanel: boolean;
  isSiteAdmin: boolean;
};

const initial: PlanifyExtendedAccess = {
  loading: true,
  authenticated: false,
  premium: false,
  email: "",
  planKey: null,
  tier: "free",
  profileRole: "teacher",
  schoolId: null,
  schoolMembershipRole: null,
  hasSchoolMembership: false,
  isSchoolManager: false,
  isDirector: false,
  isManagerView: false,
  canViewBnccProgress: false,
  canViewDirectorPanel: false,
  isSiteAdmin: false,
};

export function usePlanifyAccess() {
  const [access, setAccess] = useState<PlanifyExtendedAccess>(initial);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        await ensurePremiumSessionCookies();
        const data = await fetchFullPlanifyAccessStatus();

        if (!active) return;

        setAccess({
          loading: false,
          authenticated: Boolean(data?.authenticated),
          premium: Boolean(data?.premium),
          email: data?.email || "",
          planKey: data?.planKey ?? null,
          tier: (data?.tier as AccessTier) || "free",
          profileRole: data?.profileRole || "teacher",
          schoolId: data?.schoolId ?? null,
          schoolMembershipRole:
            (data?.schoolMembershipRole as SchoolMembershipRole | null) ?? null,
          hasSchoolMembership: Boolean(data?.hasSchoolMembership),
          isSchoolManager: Boolean(data?.isSchoolManager),
          isDirector: Boolean(data?.isDirector),
          isManagerView: Boolean(data?.isManagerView),
          canViewBnccProgress: Boolean(data?.canViewBnccProgress),
          canViewDirectorPanel: Boolean(data?.canViewDirectorPanel),
          isSiteAdmin: Boolean(data?.isSiteAdmin),
        });
      } catch {
        if (!active) return;
        setAccess({ ...initial, loading: false });
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  return access;
}
