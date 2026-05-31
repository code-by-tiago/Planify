export type AccessPlanStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "unpaid"
  | "none";

export type AccessRole = "admin" | "teacher" | "user";

export type AccessProfile = {
  id: string;
  email: string;
  fullName?: string | null;
  role: AccessRole;
  isAdmin: boolean;
};

export type AccessSubscription = {
  id: string;
  userId: string;
  planId?: string | null;
  status: AccessPlanStatus;
  currentPeriodEnd?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
};

export type PremiumAccessResult = {
  authenticated: boolean;
  premium: boolean;
  reason:
    | "allowed"
    | "missing_token"
    | "invalid_token"
    | "missing_profile"
    | "admin"
    | "active_subscription"
    | "inactive_subscription"
    | "expired_subscription"
    | "server_error";
  user?: AccessProfile;
  subscription?: AccessSubscription | null;
  message: string;
};

export type AccessCookiePayload = {
  authenticated: boolean;
  premium: boolean;
  role: AccessRole;
  checkedAt: string;
};
