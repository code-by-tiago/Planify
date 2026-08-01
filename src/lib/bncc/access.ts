import { normalizeBillingPlanKey } from "@/types/billing";
import type { SchoolMembershipRole } from "@/types/school";

export type AccessTier = "free" | "pro" | "premium";

export type PlanifyProfileRole =
  | "owner"
  | "admin"
  | "teacher"
  | "school_manager";

export type PlanifyAccessContext = {
  tier: AccessTier;
  profileRole: PlanifyProfileRole | string;
  schoolId: string | null;
  schoolMembershipRole: SchoolMembershipRole | null;
  hasSchoolMembership: boolean;
  isSchoolManager: boolean;
  isDirector: boolean;
  isManagerView: boolean;
  canViewBnccProgress: boolean;
  canViewDirectorPanel: boolean;
};

export function resolveAccessTier(input: {
  premium: boolean;
  planKey?: string | null;
  isAdmin?: boolean;
}): AccessTier {
  if (input.isAdmin || !input.premium) {
    if (!input.premium) return "free";
  }

  const normalized = normalizeBillingPlanKey(input.planKey);
  if (normalized === "premium") return "premium";
  if (input.premium) return "pro";
  return "free";
}

export function buildPlanifyAccessContext(input: {
  premium: boolean;
  planKey?: string | null;
  isAdmin?: boolean;
  isSiteAdmin?: boolean;
  profileRole?: string | null;
  schoolId?: string | null;
  schoolMembershipRole?: SchoolMembershipRole | null;
}): PlanifyAccessContext {
  const tier = resolveAccessTier(input);
  const profileRole = (input.profileRole || "teacher") as PlanifyProfileRole;
  const schoolMembershipRole = input.schoolMembershipRole ?? null;
  const hasSchoolMembership = Boolean(input.schoolId && schoolMembershipRole);
  const isSchoolManager = profileRole === "school_manager";
  const isDirector = schoolMembershipRole === "director";
  const isSiteAdmin =
    Boolean(input.isSiteAdmin) ||
    profileRole === "admin" ||
    profileRole === "owner";
  const isManagerView =
    !isSiteAdmin && (isSchoolManager || isDirector);

  const canViewBnccProgress =
    tier === "pro" || tier === "premium" || hasSchoolMembership;
  const canViewDirectorPanel =
    !isSiteAdmin &&
    (isSchoolManager || isDirector) &&
    Boolean(input.schoolId);

  return {
    tier,
    profileRole,
    schoolId: input.schoolId ?? null,
    schoolMembershipRole,
    hasSchoolMembership,
    isSchoolManager,
    isDirector,
    isManagerView,
    canViewBnccProgress,
    canViewDirectorPanel,
  };
}
