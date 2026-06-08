/**
 * Concede acesso cortesia ilimitado (premium + bypass de quotas no app).
 *
 * Uso:
 *   node scripts/planify/admin/conceder-cortesia-ilimitada.cjs \
 *     --email "professor@escola.edu.br"
 *
 * Opcional:
 *   --user-id <uuid>
 *   --plan pro|premium|escola
 */
const { createClient } = require("@supabase/supabase-js");
const { getArg, loadPlanifyEnv, requireEnv } = require("./_env.cjs");

const UNLIMITED_CREDITS = 999_999;
const DEFAULT_PLAN_KEY = "pro";

loadPlanifyEnv(process.cwd());

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

async function findUserByEmail(supabase, email) {
  let page = 1;
  const perPage = 100;

  while (page <= 30) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw new Error(error.message);
    }

    const user = data.users.find(
      (item) => normalizeEmail(item.email) === email,
    );

    if (user) {
      return user;
    }

    if (data.users.length < perPage) {
      return null;
    }

    page += 1;
  }

  return null;
}

async function main() {
  const email = normalizeEmail(getArg("--email"));
  const userIdArg = String(getArg("--user-id") || "").trim();
  const planKey = String(getArg("--plan") || DEFAULT_PLAN_KEY).trim().toLowerCase();

  if (!email && !userIdArg) {
    console.error("");
    console.error("Uso:");
    console.error(
      'node scripts\\planify\\admin\\conceder-cortesia-ilimitada.cjs --email "professor@escola.edu.br" [--user-id <uuid>] [--plan pro]',
    );
    process.exit(1);
  }

  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  console.log("");
  console.log("Planify | Cortesia ilimitada");
  console.log("");

  let userId = userIdArg;
  let resolvedEmail = email;

  if (!userId && email) {
    const user = await findUserByEmail(supabase, email);
    if (!user) {
      throw new Error(`Usuário não encontrado: ${email}`);
    }
    userId = user.id;
    resolvedEmail = normalizeEmail(user.email);
  }

  const { data: profile, error: profileReadError } = await supabase
    .from("profiles")
    .select("id,email,full_name,role,is_admin,plan")
    .eq("id", userId)
    .maybeSingle();

  if (profileReadError) {
    throw new Error(profileReadError.message);
  }

  if (!profile) {
    throw new Error(`Perfil não encontrado para user_id=${userId}`);
  }

  resolvedEmail = resolvedEmail || normalizeEmail(profile.email);

  const cycleEnd = new Date();
  cycleEnd.setFullYear(cycleEnd.getFullYear() + 1);

  const { error: profileError } = await supabase.from("profiles").update({
    email: resolvedEmail,
    plan: planKey,
    role: "teacher",
    is_admin: false,
    updated_at: new Date().toISOString(),
  }).eq("id", userId);

  if (profileError) {
    throw new Error(profileError.message);
  }

  const walletPayload = {
    user_id: userId,
    balance: UNLIMITED_CREDITS,
    monthly_limit: UNLIMITED_CREDITS,
    used_this_cycle: 0,
    cycle_started_at: new Date().toISOString(),
    cycle_ends_at: cycleEnd.toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error: walletError } = await supabase
    .from("credit_wallets")
    .upsert(walletPayload, { onConflict: "user_id" });

  if (walletError) {
    throw new Error(`Carteira de créditos: ${walletError.message}`);
  }

  const { data: subscription, error: subError } = await supabase
    .from("subscriptions")
    .select("id,status,plan_key,current_period_end")
    .eq("user_id", userId)
    .in("status", ["active", "trialing"])
    .order("current_period_end", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (subError) {
    console.warn("Aviso: não foi possível consultar assinatura:", subError.message);
  }

  console.log("Cortesia ilimitada aplicada.");
  console.log(`User ID: ${userId}`);
  console.log(`E-mail: ${resolvedEmail}`);
  console.log(`Plano (profile): ${planKey}`);
  console.log(`Role: teacher | is_admin: false`);
  console.log(`Créditos (carteira): ${UNLIMITED_CREDITS}`);
  console.log(
    `Assinatura ativa: ${
      subscription
        ? `${subscription.status} (${subscription.plan_key || "sem plan_key"}) até ${subscription.current_period_end || "—"}`
        : "nenhuma — verifique subscriptions se o premium não liberar"
    }`,
  );
  console.log("");
  console.log(
    "Bypass de quotas: e-mail na lista de cortesia (courtesy-emails.ts + PLANIFY_COURTESY_EMAILS).",
  );
  console.log("");
}

main().catch((error) => {
  console.error("");
  console.error("Erro:");
  console.error(error.message);
  process.exit(1);
});
