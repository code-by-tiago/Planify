import {
  getBillingPlan,
  normalizeBillingPlanKey,
} from "@/types/billing";
import { getSupabaseAdminClient } from "../supabase/admin-client";

type PremiumAccessUser = {
  id: string;
  email: string | null;
  role: string;
  isAdmin: boolean;
};

type PremiumAccessSubscription = {
  id: string;
  status: string;
  planId: string | null;
  planKey: string | null;
  priceId: string | null;
  currentPeriodEnd: string | null;
};

export type PremiumAccessResult = {
  authenticated: boolean;
  premium: boolean;
  message: string;
  user: PremiumAccessUser | null;
  subscription: PremiumAccessSubscription | null;
};

type ProfileRow = {
  role?: string | null;
  is_admin?: boolean | null;
  email?: string | null;
  plan?: string | null;
};

function ownerEmails(): string[] {
  return [
    process.env.PLANIFY_ADMIN_EMAIL,
    process.env.ADMIN_EMAIL,
    process.env.NEXT_PUBLIC_ADMIN_EMAIL,
    process.env.PLANIFY_OWNER_EMAIL,
    process.env.OWNER_EMAIL,
    "ts162351@gmail.com",
  ]
    .join(",")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

type SubscriptionRow = {
  id: string;
  status: string | null;
  plan_id?: string | null;
  plan_key?: string | null;
  price_id?: string | null;
  current_period_end?: string | null;
};

const PREMIUM_STATUSES = new Set(["active", "trialing"]);

function isFutureOrEmpty(dateValue: string | null | undefined): boolean {
  if (!dateValue) {
    return true;
  }

  const time = new Date(dateValue).getTime();

  if (!Number.isFinite(time)) {
    return false;
  }

  return time > Date.now();
}

async function getProfile(userId: string): Promise<ProfileRow | null> {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("role,is_admin,email,plan")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data as ProfileRow | null;
}

async function getBestSubscription(
  userId: string,
  email: string | null,
): Promise<SubscriptionRow | null> {
  const supabase = getSupabaseAdminClient();

  const select =
    "id,status,plan_id,plan_key,price_id,current_period_end,updated_at";

  const { data: byUser, error: byUserError } = await (supabase as any)
    .from("subscriptions")
    .select(select)
    .eq("user_id", userId)
    .in("status", ["active", "trialing", "past_due", "incomplete", "canceled"])
    .order("current_period_end", {
      ascending: false,
      nullsFirst: false,
    })
    .limit(1)
    .maybeSingle();

  if (!byUserError && byUser) {
    return byUser as SubscriptionRow;
  }

  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();

  if (!normalizedEmail) {
    return null;
  }

  const { data: byEmail, error: byEmailError } = await (supabase as any)
    .from("subscriptions")
    .select(select)
    .eq("stripe_customer_email", normalizedEmail)
    .in("status", ["active", "trialing", "past_due", "incomplete", "canceled"])
    .order("current_period_end", {
      ascending: false,
      nullsFirst: false,
    })
    .limit(1)
    .maybeSingle();

  if (byEmailError) {
    return null;
  }

  return (byEmail as SubscriptionRow | null) ?? null;
}

function hasProfilePlanAccess(plan: string | null | undefined): boolean {
  const normalized = normalizeBillingPlanKey(plan);
  return Boolean(normalized && getBillingPlan(normalized));
}

function toSubscriptionResult(
  subscription: SubscriptionRow | null,
): PremiumAccessSubscription | null {
  if (!subscription) {
    return null;
  }

  return {
    id: subscription.id,
    status: subscription.status || "incomplete",
    planId: subscription.plan_id || null,
    planKey: subscription.plan_key || null,
    priceId: subscription.price_id || null,
    currentPeriodEnd: subscription.current_period_end || null,
  };
}

export async function verifyPremiumAccess(
  accessToken: string | null,
): Promise<PremiumAccessResult> {
  if (!accessToken) {
    return {
      authenticated: false,
      premium: false,
      message: "Token de acesso ausente.",
      user: null,
      subscription: null,
    };
  }

  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user) {
    return {
      authenticated: false,
      premium: false,
      message: "Sessão inválida ou expirada.",
      user: null,
      subscription: null,
    };
  }

  const profile = await getProfile(data.user.id);
  const role = profile?.role || "teacher";
  const email = String(data.user.email || profile?.email || "")
    .trim()
    .toLowerCase();
  const isOwner = Boolean(email && ownerEmails().includes(email));
  const isAdmin =
    Boolean(profile?.is_admin) || role === "admin" || isOwner;

  const user: PremiumAccessUser = {
    id: data.user.id,
    email: email || null,
    role: isAdmin ? "admin" : role,
    isAdmin,
  };

  if (isAdmin) {
    return {
      authenticated: true,
      premium: true,
      message: "Acesso admin liberado.",
      user,
      subscription: null,
    };
  }

  const subscription = await getBestSubscription(data.user.id, user.email);
  const subscriptionResult = toSubscriptionResult(subscription);
  const status = subscription?.status || "";
  const subscriptionPremium =
    PREMIUM_STATUSES.has(status) &&
    isFutureOrEmpty(subscription?.current_period_end);
  const profilePlanPremium = hasProfilePlanAccess(profile?.plan);
  const isPremium = subscriptionPremium || profilePlanPremium;

  if (!isPremium) {
    return {
      authenticated: true,
      premium: false,
      message:
        "Plano ativo não encontrado. Escolha um plano para liberar o acesso premium.",
      user,
      subscription: subscriptionResult,
    };
  }

  return {
    authenticated: true,
    premium: true,
    message: "Assinatura premium ativa.",
    user,
    subscription: subscriptionResult,
  };
}
