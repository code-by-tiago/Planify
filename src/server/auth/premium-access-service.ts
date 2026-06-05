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
};

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
    .select("role,is_admin,email")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data as ProfileRow | null;
}

async function getBestSubscription(
  userId: string,
): Promise<SubscriptionRow | null> {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await (supabase as any)
    .from("subscriptions")
    .select("id,status,plan_id,plan_key,price_id,current_period_end,updated_at")
    .eq("user_id", userId)
    .in("status", ["active", "trialing", "past_due", "incomplete", "canceled"])
    .order("current_period_end", {
      ascending: false,
      nullsFirst: false,
    })
    .limit(1)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data as SubscriptionRow | null;
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
  const isAdmin = Boolean(profile?.is_admin) || role === "admin";

  const user: PremiumAccessUser = {
    id: data.user.id,
    email: data.user.email || profile?.email || null,
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

  const subscription = await getBestSubscription(data.user.id);
  const subscriptionResult = toSubscriptionResult(subscription);
  const status = subscription?.status || "";
  const isPremium =
    PREMIUM_STATUSES.has(status) &&
    isFutureOrEmpty(subscription?.current_period_end);

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
