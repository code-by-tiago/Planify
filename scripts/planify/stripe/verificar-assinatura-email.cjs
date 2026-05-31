const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();

function parseEnvFile(file) {
  const env = {};

  if (!fs.existsSync(file)) {
    return env;
  }

  for (const rawLine of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#") || !line.includes("=")) {
      continue;
    }

    const index = line.indexOf("=");
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim().replace(/^["']|["']$/g, "");

    env[key] = value;
  }

  return env;
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isActiveStatus(status) {
  return ["active", "trialing"].includes(String(status || "").toLowerCase());
}

async function main() {
  const email = normalizeEmail(process.argv[2]);

  if (!email) {
    console.log("");
    console.log("Uso:");
    console.log("node scripts\\planify\\stripe\\verificar-assinatura-email.cjs email@exemplo.com");
    console.log("");
    process.exit(1);
  }

  const env = {
    ...parseEnvFile(path.join(root, ".env.local")),
    ...process.env,
  };

  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    console.error("ERRO: NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausente.");
    process.exit(1);
  }

  let createClient;

  try {
    ({ createClient } = require("@supabase/supabase-js"));
  } catch {
    console.error("ERRO: @supabase/supabase-js não encontrado.");
    process.exit(1);
  }

  const supabase = createClient(url, serviceRole, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  console.log("");
  console.log("Planify | Verificar assinatura por e-mail");
  console.log("");
  console.log(`E-mail: ${email}`);

  const { data: users, error: userError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (userError) {
    console.error(`ERRO ao listar usuários: ${userError.message}`);
    process.exit(1);
  }

  const user = users.users.find((candidate) => normalizeEmail(candidate.email) === email);

  if (!user) {
    console.log("[AVISO] Usuário não encontrado no Supabase Auth.");
  } else {
    console.log(`[OK] Usuário encontrado: ${user.id}`);
  }

  let query = supabase
    .from("subscriptions")
    .select("*")
    .order("updated_at", { ascending: false });

  if (user?.id) {
    query = query.or(`user_id.eq.${user.id},email.eq.${email},customer_email.eq.${email}`);
  } else {
    query = query.or(`email.eq.${email},customer_email.eq.${email}`);
  }

  const { data, error } = await query.limit(10);

  if (error) {
    console.error(`ERRO ao consultar subscriptions: ${error.message}`);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log("[AVISO] Nenhuma assinatura encontrada para este e-mail.");
    console.log("Premium esperado: NÃO");
    return;
  }

  console.log("");
  console.log("Assinaturas encontradas:");

  for (const sub of data) {
    console.log(
      `- id=${sub.id || "—"} | status=${sub.status || "—"} | price=${sub.price_id || "—"} | fim=${sub.current_period_end || "—"}`,
    );
  }

  const active = data.some((sub) => isActiveStatus(sub.status));

  console.log("");
  console.log(`Premium por assinatura: ${active ? "SIM" : "NÃO"}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
