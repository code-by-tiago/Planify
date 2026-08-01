/**
 * Diagnóstico: conta Auth + assinatura Stripe por e-mail (sem expor senha).
 * Uso: node scripts/planify/admin/diagnosticar-checkout-email.cjs --email "user@example.com"
 */
const { createClient } = require("@supabase/supabase-js");
const { getArg, loadPlanifyEnv, requireEnv } = require("./_env.cjs");

loadPlanifyEnv(process.cwd());

async function findUserByEmail(supabase, email) {
  let page = 1;
  while (page <= 30) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw new Error(error.message);
    const user = data.users.find(
      (u) => String(u.email || "").trim().toLowerCase() === email,
    );
    if (user) return user;
    if (data.users.length < 100) return null;
    page += 1;
  }
  return null;
}

async function main() {
  const email = (getArg("--email") || "").trim().toLowerCase();
  if (!email.includes("@")) {
    console.error("Use: --email user@example.com");
    process.exit(1);
  }

  const supabase = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } },
  );

  const user = await findUserByEmail(supabase, email);

  console.log(JSON.stringify({
    email,
    authUserExists: Boolean(user),
    userId: user?.id || null,
    emailConfirmed: Boolean(user?.email_confirmed_at),
    emailConfirmedAt: user?.email_confirmed_at || null,
    createdAt: user?.created_at || null,
    lastSignInAt: user?.last_sign_in_at || null,
    providers: user?.app_metadata?.providers || [],
  }, null, 2));

  const { data: subs, error: subErr } = await supabase
    .from("subscriptions")
    .select("id,status,user_id,plan_key,stripe_customer_email,current_period_end,updated_at")
    .ilike("stripe_customer_email", email);

  if (subErr) {
    console.log(JSON.stringify({ subscriptionsError: subErr.message }));
  } else {
    console.log(JSON.stringify({ subscriptions: subs || [] }, null, 2));
  }

  if (user) {
    const { data: byUser } = await supabase
      .from("subscriptions")
      .select("id,status,user_id,plan_key,stripe_customer_email")
      .eq("user_id", user.id);
    console.log(JSON.stringify({ subscriptionsByUserId: byUser || [] }, null, 2));
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
