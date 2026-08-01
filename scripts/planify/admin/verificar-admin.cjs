const { createClient } = require("@supabase/supabase-js");
const { getArg, loadPlanifyEnv, requireEnv } = require("./_env.cjs");

const projectRoot = process.cwd();

loadPlanifyEnv(projectRoot);

function getEmail() {
  return (
    getArg("--email") ||
    process.env.PLANIFY_ADMIN_EMAIL ||
    process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
    ""
  )
    .trim()
    .toLowerCase();
}

async function findUserByEmail(supabase, email) {
  let page = 1;
  const perPage = 100;

  while (page <= 20) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw new Error(error.message);
    }

    const user = data.users.find(
      (item) => String(item.email || "").trim().toLowerCase() === email,
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
  const email = getEmail();

  if (!email) {
    console.error("");
    console.error("Informe o e-mail para verificar:");
    console.error('node scripts\\planify\\admin\\verificar-admin.cjs --email "seu-email@dominio.com"');
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
  console.log("Planify | Verificar admin");
  console.log(`E-mail: ${email}`);
  console.log("");

  const user = await findUserByEmail(supabase, email);

  if (!user) {
    console.log("Auth user: não encontrado");
    process.exit(0);
  }

  console.log("Auth user: encontrado");
  console.log(`User ID: ${user.id}`);
  console.log(`Confirmado: ${Boolean(user.email_confirmed_at)}`);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,email,full_name,role,is_admin,updated_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  console.log("");
  console.log("Profile:");
  console.log(
    JSON.stringify(
      profile || {
        encontrado: false,
      },
      null,
      2,
    ),
  );

  const { data: subscriptions, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select("id,status,current_period_end,plan_id,updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(5);

  if (subscriptionError) {
    throw new Error(subscriptionError.message);
  }

  console.log("");
  console.log("Subscriptions:");
  console.log(JSON.stringify(subscriptions || [], null, 2));

  const isAdmin = Boolean(profile?.is_admin) || profile?.role === "admin";

  console.log("");
  console.log(`Resultado admin: ${isAdmin ? "SIM" : "NÃO"}`);

  if (!isAdmin) {
    console.log("");
    console.log("Para promover:");
    console.log(`node scripts\\planify\\admin\\promover-admin.cjs --email "${email}"`);
  }
}

main().catch((error) => {
  console.error("");
  console.error("Erro ao verificar admin:");
  console.error(error.message);
  process.exit(1);
});
