import { NextRequest, NextResponse } from "next/server";
import {
  createClient,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DbRecord = Record<string, unknown>;

function getSupabaseConfig() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";

  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "";

  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    "";

  return { url, anonKey, serviceKey };
}

function normalizeEmail(value: string | null | undefined) {
  return String(value || "").trim().toLowerCase();
}

function getOwnerEmails() {
  const raw = [
    process.env.PLANIFY_OWNER_EMAILS,
    process.env.OWNER_EMAILS,
    process.env.ADMIN_EMAILS,
    process.env.PLANIFY_OWNER_EMAIL,
    process.env.OWNER_EMAIL,
    process.env.ADMIN_EMAIL,
    process.env.NEXT_PUBLIC_OWNER_EMAIL,
    process.env.NEXT_PUBLIC_ADMIN_EMAIL,
  ]
    .filter(Boolean)
    .join(",");

  return raw
    .split(",")
    .map((item) => normalizeEmail(item))
    .filter(Boolean);
}

function hasAdminRole(user: User) {
  const metadata = {
    ...(user.app_metadata || {}),
    ...(user.user_metadata || {}),
  } as DbRecord;

  const role = String(metadata.role || metadata.perfil || "").toLowerCase();
  const isAdmin = metadata.admin === true || metadata.is_admin === true;

  return (
    isAdmin ||
    role === "admin" ||
    role === "owner" ||
    role === "proprietario"
  );
}

function isDateInFuture(value: unknown) {
  if (!value) return false;

  if (typeof value === "number") {
    const millis = value > 10_000_000_000 ? value : value * 1000;
    return millis > Date.now();
  }

  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) && parsed > Date.now();
  }

  return false;
}

function isActiveRecord(record: DbRecord | null) {
  if (!record) return false;

  const activeFields = [
    record.active,
    record.is_active,
    record.premium,
    record.isPremium,
    record.is_premium,
    record.plano_ativo,
    record.assinatura_ativa,
  ];

  if (activeFields.some((value) => value === true)) {
    return true;
  }

  const status = String(
    record.status ||
      record.subscription_status ||
      record.stripe_status ||
      record.plano_status ||
      ""
  ).toLowerCase();

  if (
    [
      "active",
      "trialing",
      "paid",
      "current",
      "valid",
      "ativo",
      "ativa",
      "aprovado",
    ].includes(status)
  ) {
    return true;
  }

  const futureFields = [
    record.current_period_end,
    record.currentPeriodEnd,
    record.period_end,
    record.expires_at,
    record.expira_em,
    record.valid_until,
    record.premium_until,
  ];

  return futureFields.some(isDateInFuture);
}

async function queryFirst(
  client: SupabaseClient,
  table: string,
  column: string,
  value: string
): Promise<DbRecord | null> {
  try {
    const { data, error } = await client
      .from(table)
      .select("*")
      .eq(column, value)
      .limit(1);

    if (error || !Array.isArray(data) || data.length === 0) {
      return null;
    }

    return data[0] as DbRecord;
  } catch {
    return null;
  }
}

async function findActiveSubscription(
  client: SupabaseClient,
  user: User,
  email: string
): Promise<DbRecord | null> {
  const attempts: Array<[string, string, string]> = [
    ["subscriptions", "user_id", user.id],
    ["subscriptions", "email", email],
    ["subscriptions", "user_email", email],
    ["subscriptions", "customer_email", email],
    ["assinaturas", "user_id", user.id],
    ["assinaturas", "email", email],
    ["profiles", "id", user.id],
    ["profiles", "email", email],
    ["usuarios", "id", user.id],
    ["usuarios", "email", email],
  ];

  for (const [table, column, value] of attempts) {
    const record = await queryFirst(client, table, column, value);

    if (isActiveRecord(record)) {
      return record;
    }
  }

  return null;
}

export async function GET(request: NextRequest) {
  const { url, anonKey, serviceKey } = getSupabaseConfig();

  if (!url || !anonKey) {
    return NextResponse.json({
      authenticated: false,
      premium: false,
      email: "",
      message: "Supabase não configurado para verificar acesso.",
    });
  }

  const token = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "")
    .trim();

  if (!token) {
    return NextResponse.json({
      authenticated: false,
      premium: false,
      email: "",
      message: "Sessão não encontrada.",
    });
  }

  const authClient = createClient(url, anonKey);
  const { data, error } = await authClient.auth.getUser(token);

  if (error || !data.user) {
    return NextResponse.json({
      authenticated: false,
      premium: false,
      email: "",
      message: "Sessão inválida ou expirada.",
    });
  }

  const user = data.user;
  const email = normalizeEmail(user.email);
  const ownerEmails = getOwnerEmails();

  if (email && (ownerEmails.includes(email) || hasAdminRole(user))) {
    return NextResponse.json({
      authenticated: true,
      premium: true,
      email,
      source: "owner",
      message: "Acesso de proprietário/admin confirmado.",
    });
  }

  const dbClient = createClient(url, serviceKey || anonKey);
  const subscription = await findActiveSubscription(dbClient, user, email);

  return NextResponse.json({
    authenticated: true,
    premium: Boolean(subscription),
    email,
    source: subscription ? "subscription" : "none",
    message: subscription
      ? "Plano premium ativo confirmado."
      : "Nenhum plano premium ativo foi encontrado para este e-mail.",
  });
}
