/**
 * Cria usuário no Supabase Auth (e-mail confirmado).
 *
 * Uso:
 *   $env:PLANIFY_NEW_USER_PASSWORD="senha-segura"
 *   node scripts/planify/admin/criar-usuario-auth.cjs --email "usuario@escola.edu.br"
 */
const { createClient } = require("@supabase/supabase-js");
const { getArg, loadPlanifyEnv, requireEnv } = require("./_env.cjs");

loadPlanifyEnv(process.cwd());

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

async function main() {
  const email = normalizeEmail(getArg("--email"));
  const password = String(process.env.PLANIFY_NEW_USER_PASSWORD || "").trim();
  const fullName = String(getArg("--name") || "Fundadora Planify").trim();

  if (!email) {
    console.error("Informe --email");
    process.exit(1);
  }

  if (!password || password.length < 8) {
    console.error(
      "Defina PLANIFY_NEW_USER_PASSWORD (mín. 8 caracteres) antes de executar.",
    );
    process.exit(1);
  }

  const supabase = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      name: fullName,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  console.log("Usuário criado no Supabase Auth.");
  console.log(`User ID: ${data.user.id}`);
  console.log(`E-mail: ${email}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
