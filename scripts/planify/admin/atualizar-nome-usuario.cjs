/**
 * Atualiza o nome exibido (profiles.full_name + auth user_metadata) de um usuário.
 * Uso:
 *   node scripts/planify/admin/atualizar-nome-usuario.cjs \
 *     --email "ts162351@gmail.com" \
 *     --name "Tiago"
 */
const { createClient } = require("@supabase/supabase-js");
const { getArg, loadPlanifyEnv, requireEnv } = require("./_env.cjs");

const projectRoot = process.cwd();

loadPlanifyEnv(projectRoot);

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
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
  const fullName = String(getArg("--name") || "").trim();

  if (!email || !fullName) {
    console.error("");
    console.error("Uso:");
    console.error(
      'node scripts\\planify\\admin\\atualizar-nome-usuario.cjs --email "usuario@email.com" --name "Nome Completo"',
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
  console.log(`Atualizando nome para ${email}…`);

  const user = await findUserByEmail(supabase, email);

  if (!user) {
    throw new Error(`Usuário não encontrado: ${email}`);
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (profileError) {
    throw new Error(profileError.message);
  }

  const { error: authError } = await supabase.auth.admin.updateUserById(
    user.id,
    {
      user_metadata: {
        ...(user.user_metadata || {}),
        full_name: fullName,
        name: fullName,
      },
    },
  );

  if (authError) {
    throw new Error(authError.message);
  }

  console.log(`Nome atualizado para "${fullName}" (${user.id}).`);
}

main().catch((error) => {
  console.error("");
  console.error(error.message || error);
  process.exit(1);
});
