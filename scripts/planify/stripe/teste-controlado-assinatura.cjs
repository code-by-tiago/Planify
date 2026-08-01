const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const outDir = path.join(root, "docs", "auditorias");

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

function mask(value) {
  if (!value) return "";
  return value.length > 12 ? `${value.slice(0, 8)}...${value.slice(-4)}` : "***";
}

function ok(text) {
  return `[OK] ${text}`;
}

function warn(text) {
  return `[AVISO] ${text}`;
}

function fail(text) {
  return `[ERRO] ${text}`;
}

function getPriceKeys(env) {
  return Object.keys(env)
    .filter((key) => /^price_/.test(env[key] || ""))
    .sort();
}

function getMode(secret) {
  if (!secret) return "ausente";
  if (secret.startsWith("sk_test_")) return "test";
  if (secret.startsWith("sk_live_")) return "live";
  return "desconhecido";
}

async function inspectStripe(env, lines) {
  const secret = env.STRIPE_SECRET_KEY;
  const mode = getMode(secret);

  lines.push("");
  lines.push("## Stripe");

  if (!secret) {
    lines.push(fail("STRIPE_SECRET_KEY ausente."));
    return;
  }

  lines.push(ok(`STRIPE_SECRET_KEY configurado (${mask(secret)})`));
  lines.push(ok(`Modo detectado: ${mode.toUpperCase()}`));

  if (mode === "live") {
    lines.push(warn("Você está usando chave LIVE. Não use cartão de teste aqui. Qualquer pagamento será real."));
  }

  if (mode === "test") {
    lines.push(ok("Ambiente em modo TEST. Pode usar cartões de teste do Stripe."));
  }

  let Stripe;

  try {
    Stripe = require("stripe");
  } catch {
    lines.push(fail("Pacote stripe não encontrado. Rode: npm install stripe --save"));
    return;
  }

  const stripe = new Stripe(secret);

  try {
    const account = await stripe.accounts.retrieve();
    lines.push(ok(`Conta Stripe conectada: ${account.id}`));
    lines.push(ok(`Charges enabled: ${account.charges_enabled}`));
    lines.push(ok(`Payouts enabled: ${account.payouts_enabled}`));
  } catch (error) {
    lines.push(fail(`Não foi possível conectar ao Stripe: ${error.message || error}`));
    return;
  }

  const priceKeys = getPriceKeys(env);

  if (priceKeys.length === 0) {
    lines.push(fail("Nenhum Price ID price_ encontrado no .env.local."));
    return;
  }

  lines.push("");
  lines.push("### Price IDs");

  for (const key of priceKeys) {
    const priceId = env[key];

    try {
      const price = await stripe.prices.retrieve(priceId);
      const product =
        typeof price.product === "string"
          ? await stripe.products.retrieve(price.product).catch(() => null)
          : null;

      lines.push(
        ok(
          `${key}: ${price.id} | ${price.active ? "ativo" : "inativo"} | ${price.currency.toUpperCase()} ${(price.unit_amount || 0) / 100} | ${price.recurring?.interval || "único"} | produto: ${product?.name || price.product}`,
        ),
      );
    } catch (error) {
      lines.push(fail(`${key}: ${priceId} não pôde ser lido. ${error.message || error}`));
    }
  }
}

async function inspectSupabase(env, lines) {
  lines.push("");
  lines.push("## Supabase / subscriptions");

  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    lines.push(fail("NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausente."));
    return;
  }

  let createClient;

  try {
    ({ createClient } = require("@supabase/supabase-js"));
  } catch {
    lines.push(fail("@supabase/supabase-js não encontrado."));
    return;
  }

  const supabase = createClient(url, serviceRole, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error, count } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact" })
    .order("updated_at", { ascending: false })
    .limit(10);

  if (error) {
    lines.push(fail(`Erro ao consultar subscriptions: ${error.message}`));
    return;
  }

  lines.push(ok(`Tabela subscriptions acessível. Total aproximado: ${count ?? data?.length ?? 0}`));

  if (!data || data.length === 0) {
    lines.push(warn("Nenhuma assinatura encontrada ainda. Isso é normal antes do primeiro checkout concluído."));
    return;
  }

  lines.push("");
  lines.push("### Últimas assinaturas");

  for (const sub of data) {
    lines.push(
      `- id=${sub.id || "—"} | user_id=${sub.user_id || "—"} | email=${sub.email || sub.customer_email || "—"} | status=${sub.status || "—"} | price=${sub.price_id || "—"} | fim=${sub.current_period_end || "—"}`,
    );
  }
}

async function main() {
  const env = {
    ...parseEnvFile(path.join(root, ".env.local")),
    ...process.env,
  };

  const lines = [
    "# Planify — Teste controlado do fluxo de assinatura",
    "",
    `Data: ${new Date().toLocaleString("pt-BR")}`,
    "",
    "## Objetivo",
    "",
    "Validar Stripe, planos, subscriptions e condições para testar login premium sem alterar funcionalidades.",
  ];

  await inspectStripe(env, lines);
  await inspectSupabase(env, lines);

  lines.push("");
  lines.push("## Checklist manual seguro");
  lines.push("");
  lines.push("1. Abra /planos.");
  lines.push("2. Clique no plano mensal ou anual.");
  lines.push("3. Confirme se abriu o Checkout Stripe correto.");
  lines.push("4. Se estiver em modo LIVE, não use cartão de teste. Pagamento será real.");
  lines.push("5. Se estiver em modo TEST, use cartão de teste Stripe.");
  lines.push("6. Depois do pagamento, confira /planos/sucesso.");
  lines.push("7. Confira a tabela subscriptions no Supabase.");
  lines.push("8. Faça login com o e-mail comprador.");
  lines.push("9. Abra /api/access/status.");
  lines.push("10. O esperado para pagante ativo é premium=true.");
  lines.push("11. Abra /dashboard, /planejamentos, /materiais e /biblioteca.");
  lines.push("12. Teste um usuário comum sem plano e confirme bloqueio.");

  fs.mkdirSync(outDir, { recursive: true });
  const file = path.join(
    outDir,
    `teste-controlado-assinatura-${new Date().toISOString().replace(/[:.]/g, "-")}.md`,
  );

  fs.writeFileSync(file, `${lines.join("\n")}\n`, "utf8");

  console.log("");
  console.log("===============================================");
  console.log("Planify | Teste controlado de assinatura");
  console.log("===============================================");
  console.log("");
  console.log(`Relatório salvo em: ${file}`);
  console.log("");
  console.log(lines.join("\n"));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
