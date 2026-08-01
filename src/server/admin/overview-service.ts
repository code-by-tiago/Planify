import { getSupabaseAdminClient } from "../supabase/admin-client";
import { fetchGenerationStats } from "../telemetry/generation-stats-service";

export type AdminUserRow = {
  id: string;
  email: string;
  fullName: string | null;
  planKey: string | null;
  status: string;
  createdAt: string;
};

export type AdminOverview = {
  users: {
    total: number;
    activeSubscriptions: number;
    recent: AdminUserRow[];
  };
  content: {
    libraryMaterials: number;
    marketplaceMaterials: number;
  };
  credits: {
    walletsWithBalance: number;
    totalBalance: number;
    usageLast24h: number;
  };
  generations: {
    last24h: number;
    last7d: number;
  };
  checkedAt: string;
};

type CountResult = { count: number | null; error: { message: string } | null };

async function safeCount(
  table: string,
  filter?: { column: string; value: unknown },
): Promise<number> {
  try {
    const supabase = getSupabaseAdminClient() as any;
    let query = supabase.from(table).select("*", { count: "exact", head: true });

    if (filter) {
      query = query.eq(filter.column, filter.value);
    }

    const { count, error } = (await query) as CountResult;
    if (error || count == null) return 0;
    return count;
  } catch {
    return 0;
  }
}

async function fetchRecentUsers(): Promise<AdminUserRow[]> {
  try {
    const supabase = getSupabaseAdminClient() as any;

    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id,email,full_name,status,created_at")
      .order("created_at", { ascending: false })
      .limit(12);

    if (error || !Array.isArray(profiles)) {
      return [];
    }

    const userIds = profiles.map((row: { id: string }) => row.id);

    const { data: subs } = await supabase
      .from("subscriptions")
      .select("user_id,plan_key,status")
      .in("user_id", userIds)
      .in("status", ["active", "trialing"]);

    const planByUser = new Map<string, string>();
    for (const sub of subs || []) {
      if (sub.user_id && sub.plan_key) {
        planByUser.set(sub.user_id, sub.plan_key);
      }
    }

    return profiles.map(
      (row: {
        id: string;
        email: string;
        full_name: string | null;
        status: string;
        created_at: string;
      }) => ({
        id: row.id,
        email: row.email,
        fullName: row.full_name,
        planKey: planByUser.get(row.id) || null,
        status: row.status,
        createdAt: row.created_at,
      }),
    );
  } catch {
    return [];
  }
}

async function fetchCreditSummary() {
  try {
    const supabase = getSupabaseAdminClient() as any;

    const { data: wallets } = await supabase
      .from("credit_wallets")
      .select("balance");

    const rows = (wallets || []) as Array<{ balance: number }>;
    const totalBalance = rows.reduce(
      (sum, row) => sum + (Number(row.balance) || 0),
      0,
    );
    const walletsWithBalance = rows.filter((row) => Number(row.balance) > 0).length;

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const usageLast24h = await safeCount("credit_usage");

    void since;

    let usageCount = 0;
    try {
      const { count } = await supabase
        .from("credit_usage")
        .select("*", { count: "exact", head: true })
        .gte("created_at", since);
      usageCount = count || 0;
    } catch {
      usageCount = usageLast24h;
    }

    return {
      walletsWithBalance,
      totalBalance,
      usageLast24h: usageCount,
    };
  } catch {
    return {
      walletsWithBalance: 0,
      totalBalance: 0,
      usageLast24h: 0,
    };
  }
}

export async function fetchAdminOverview(): Promise<AdminOverview> {
  const [stats24h, stats7d, recent, credits] = await Promise.all([
    fetchGenerationStats("24h"),
    fetchGenerationStats("7d"),
    fetchRecentUsers(),
    fetchCreditSummary(),
  ]);

  const [
    totalUsers,
    activeSubscriptions,
    libraryMaterials,
    marketplaceMaterials,
  ] = await Promise.all([
    safeCount("profiles"),
    safeCount("subscriptions", { column: "status", value: "active" }),
    safeCount("library_materials"),
    safeCount("marketplace_materials"),
  ]);

  return {
    users: {
      total: totalUsers,
      activeSubscriptions,
      recent,
    },
    content: {
      libraryMaterials,
      marketplaceMaterials,
    },
    credits,
    generations: {
      last24h: stats24h.total,
      last7d: stats7d.total,
    },
    checkedAt: new Date().toISOString(),
  };
}
