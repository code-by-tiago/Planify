/**
 * Migra conta existente para professor normal (e-mail + senha + role teacher).
 * Uso:
 *   node scripts/planify/admin/configurar-professor.cjs \
 *     --from "antigo@email.com" \
 *     --to "professor@escola.edu.br" \
 *     --password "SenhaSegura123" \
 *     --name "Nome da Professora"
 *
 * Nunca commite senhas no repositório.
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
  const fromEmail = normalizeEmail(getArg("--from"));
  const toEmail = normalizeEmail(getArg("--to"));
  const password = String(getArg("--password") || "").trim();
  const fullName = String(getArg("--name") || "Professora Planify").trim();

  if (!fromEmail || !toEmail || !password) {
    console.error("");
    console.error("Uso:");
    console.error(
      'node scripts\\planify\\admin\\configurar-professor.cjs --from "antigo@email.com" --to "professor@escola.edu.br" --password "Senha" [--name "Nome"]',
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
  console.log("Planify | Configurar professor normal");
  console.log(`De: ${fromEmail}`);
  console.log(`Para: ${toEmail}`);
  console.log("");

  const existingTarget = await findUserByEmail(supabase, toEmail);
  if (existingTarget && normalizeEmail(existingTarget.email) === toEmail) {
    const fromUser = await findUserByEmail(supabase, fromEmail);
    if (!fromUser || existingTarget.id !== fromUser.id) {
      throw new Error(
        `Já existe outro usuário com o e-mail destino (${toEmail}). Resolva manualmente no Supabase Auth.`,
      );
    }
  }

  const user = await findUserByEmail(supabase, fromEmail);

  if (!user) {
    throw new Error(`Usuário de origem não encontrado: ${fromEmail}`);
  }

  const { data: authData, error: authError } = await supabase.auth.admin.updateUserById(
    user.id,
    {
      email: toEmail,
      password,
      email_confirm: true,
      user_metadata: {
        ...user.user_metadata,
        full_name: fullName,
      },
    },
  );

  if (authError) {
    throw new Error(authError.message);
  }

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: toEmail,
      full_name: fullName,
      role: "teacher",
      is_admin: false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (profileError) {
    throw new Error(profileError.message);
  }

  const { data: invites, error: inviteSelectError } = await supabase
    .from("school_invites")
    .select("id,email,status,school_id")
    .ilike("email", fromEmail);

  if (inviteSelectError) {
    console.warn("Aviso: não foi possível consultar convites:", inviteSelectError.message);
  } else if (invites?.length) {
    const { error: inviteUpdateError } = await supabase
      .from("school_invites")
      .update({ email: toEmail, updated_at: new Date().toISOString() })
      .ilike("email", fromEmail);

    if (inviteUpdateError) {
      console.warn("Aviso: convites não atualizados:", inviteUpdateError.message);
    } else {
      console.log(`Convites escolares atualizados: ${invites.length}`);
    }
  }

  console.log("Conta migrada para professor normal.");
  console.log(`User ID: ${authData.user.id}`);
  console.log(`E-mail: ${toEmail}`);
  console.log("Role: teacher | is_admin: false");
  console.log("");
  console.log("Próximo passo: login em /login (modo professor, não Admin).");
  console.log("");
}

main().catch((error) => {
  console.error("");
  console.error("Erro:");
  console.error(error.message);
  process.exit(1);
});
