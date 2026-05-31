const path = require("node:path");
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
    console.error("Informe o e-mail do dono do site:");
    console.error('node scripts\\planify\\admin\\promover-admin.cjs --email "seu-email@dominio.com"');
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
  console.log("Planify | Promover dono do site para admin");
  console.log(`E-mail: ${email}`);
  console.log("");

  const user = await findUserByEmail(supabase, email);

  if (!user) {
    console.error("Usuário não encontrado no Supabase Auth.");
    console.error("");
    console.error("Faça uma destas opções:");
    console.error("1. Crie a conta em /login usando este e-mail.");
    console.error("2. Ou crie o usuário manualmente em Supabase > Authentication > Users.");
    console.error("3. Depois rode este script novamente.");
    process.exit(1);
  }

  const fullName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    "Dono do Planify";

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email,
      full_name: fullName,
      role: "admin",
      is_admin: true,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "id",
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  console.log("Admin configurado com sucesso.");
  console.log("");
  console.log(`User ID: ${user.id}`);
  console.log(`E-mail: ${email}`);
  console.log("Role: admin");
  console.log("is_admin: true");
  console.log("");
  console.log("Agora faça login em /login com este usuário.");
}

main().catch((error) => {
  console.error("");
  console.error("Erro ao promover admin:");
  console.error(error.message);
  process.exit(1);
});
