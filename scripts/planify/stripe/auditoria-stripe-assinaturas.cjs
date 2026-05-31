const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();

const report = [];
let failures = 0;
let warnings = 0;

function title(value) {
  report.push("");
  report.push(`## ${value}`);
}

function ok(value) {
  report.push(`[OK] ${value}`);
}

function warn(value) {
  warnings += 1;
  report.push(`[AVISO] ${value}`);
}

function fail(value) {
  failures += 1;
  report.push(`[ERRO] ${value}`);
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function read(relativePath) {
  try {
    return fs.readFileSync(path.join(root, relativePath), "utf8");
  } catch {
    return "";
  }
}

function listFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (
        [
          "node_modules",
          ".next",
          ".git",
          ".vercel",
          "out",
          "dist",
          "coverage",
        ].includes(entry.name)
      ) {
        continue;
      }

      listFiles(full, acc);
    } else {
      acc.push(full);
    }
  }

  return acc;
}

function isTextFile(file) {
  return [
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".cjs",
    ".mjs",
    ".json",
    ".md",
    ".sql",
    ".env",
    ".local",
  ].includes(path.extname(file).toLowerCase()) || path.basename(file).startsWith(".env");
}

function relative(file) {
  return path.relative(root, file).replaceAll("\\", "/");
}

function parseEnv(text) {
  const env = {};

  for (const rawLine of text.split(/\r?\n/)) {
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

  if (value.length <= 10) return "***";

  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function isProbablyStripeSecret(value) {
  return /^sk_(test|live)_/.test(value || "");
}

function isProbablyStripeWebhook(value) {
  return /^whsec_/.test(value || "");
}

function isProbablyStripePrice(value) {
  return /^price_/.test(value || "");
}

function isProbablyStripePublishable(value) {
  return /^pk_(test|live)_/.test(value || "");
}

function findFilesContaining(patterns, rootDir = "src") {
  const files = listFiles(path.join(root, rootDir)).filter(isTextFile);
  const results = [];

  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    const matched = patterns.some((pattern) =>
      typeof pattern === "string" ? text.includes(pattern) : pattern.test(text),
    );

    if (matched) {
      results.push(relative(file));
    }
  }

  return results;
}

function envKeysContaining(env, patterns) {
  return Object.keys(env).filter((key) =>
    patterns.some((pattern) =>
      typeof pattern === "string" ? key.includes(pattern) : pattern.test(key),
    ),
  );
}

function checkPackage() {
  title("Dependências");

  const pkg = read("package.json");

  if (!pkg) {
    fail("package.json não encontrado.");
    return;
  }

  let json;

  try {
    json = JSON.parse(pkg);
  } catch {
    fail("package.json não é JSON válido.");
    return;
  }

  const deps = {
    ...(json.dependencies || {}),
    ...(json.devDependencies || {}),
  };

  if (deps.stripe) {
    ok(`stripe instalado: ${deps.stripe}`);
  } else {
    fail("Dependência stripe não encontrada.");
  }

  if (deps["@supabase/supabase-js"]) {
    ok(`@supabase/supabase-js instalado: ${deps["@supabase/supabase-js"]}`);
  } else {
    warn("@supabase/supabase-js não encontrado nas dependências.");
  }
}

function checkEnv() {
  title(".env.local Stripe/Supabase");

  const envText = read(".env.local");

  if (!envText) {
    fail(".env.local não encontrado ou vazio.");
    return {};
  }

  const env = parseEnv(envText);

  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
  ];

  for (const key of required) {
    if (env[key]) {
      ok(`${key} configurado (${mask(env[key])})`);
    } else {
      fail(`${key} ausente ou vazio.`);
    }
  }

  if (isProbablyStripeSecret(env.STRIPE_SECRET_KEY)) {
    ok("STRIPE_SECRET_KEY tem formato esperado sk_test/sk_live.");
  } else if (env.STRIPE_SECRET_KEY) {
    warn("STRIPE_SECRET_KEY existe, mas não tem formato sk_test/sk_live.");
  }

  if (isProbablyStripeWebhook(env.STRIPE_WEBHOOK_SECRET)) {
    ok("STRIPE_WEBHOOK_SECRET tem formato esperado whsec_.");
  } else if (env.STRIPE_WEBHOOK_SECRET) {
    warn("STRIPE_WEBHOOK_SECRET existe, mas não tem formato whsec_.");
  }

  const publishableKeys = envKeysContaining(env, [
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    "STRIPE_PUBLISHABLE_KEY",
  ]);

  if (publishableKeys.length > 0) {
    for (const key of publishableKeys) {
      if (isProbablyStripePublishable(env[key])) {
        ok(`${key} configurado como chave pública Stripe (${mask(env[key])})`);
      } else {
        warn(`${key} encontrado, mas não parece pk_test/pk_live.`);
      }
    }
  } else {
    warn("Chave pública Stripe não encontrada por nome padrão. Isso é aceitável se checkout for server-side.");
  }

  const priceKeys = Object.keys(env).filter((key) => {
    const upper = key.toUpperCase();

    return (
      upper.includes("PRICE") ||
      upper.includes("PRECO") ||
      upper.includes("PLANO") ||
      upper.includes("PROFESSOR") ||
      upper.includes("STRIPE_PLAN")
    );
  });

  const priceIdKeys = priceKeys.filter((key) => isProbablyStripePrice(env[key]));

  if (priceIdKeys.length > 0) {
    ok(`Price IDs Stripe encontrados: ${priceIdKeys.map((key) => `${key}=${mask(env[key])}`).join(", ")}`);
  } else {
    warn("Nenhum price_ encontrado no .env.local por nome de variável. Confira se os planos mensal/anual estão mapeados.");
  }

  return env;
}

function checkRoutes() {
  title("Rotas Stripe");

  const stripeFiles = findFilesContaining(["stripe", "Stripe", "checkout", "webhook", "subscriptions"]);

  if (stripeFiles.length > 0) {
    ok(`Arquivos com referência Stripe/subscriptions: ${stripeFiles.length}`);
    for (const file of stripeFiles.slice(0, 30)) {
      report.push(`   - ${file}`);
    }
  } else {
    fail("Nenhum arquivo com referência a Stripe/subscriptions encontrado em src.");
  }

  const webhookCandidates = stripeFiles.filter((file) =>
    file.toLowerCase().includes("webhook"),
  );

  if (webhookCandidates.length > 0) {
    ok(`Webhook Stripe encontrado: ${webhookCandidates.join(", ")}`);
  } else {
    fail("Webhook Stripe não encontrado pelo nome do arquivo.");
  }

  const checkoutCandidates = stripeFiles.filter((file) =>
    file.toLowerCase().includes("checkout") ||
    read(file).includes("checkout.sessions.create") ||
    read(file).includes("billingPortal.sessions.create")
  );

  if (checkoutCandidates.length > 0) {
    ok(`Rota/serviço de checkout encontrado: ${[...new Set(checkoutCandidates)].join(", ")}`);
  } else {
    warn("Não encontrei checkout pelo nome/assinatura padrão. Pode estar com outro nome.");
  }
}

function checkWebhookImplementation() {
  title("Webhook Stripe");

  const files = listFiles(path.join(root, "src")).filter(isTextFile);
  const candidates = files
    .map((file) => [relative(file), fs.readFileSync(file, "utf8")])
    .filter(([file, text]) =>
      file.toLowerCase().includes("webhook") ||
      text.includes("constructEvent") ||
      text.includes("STRIPE_WEBHOOK_SECRET"),
    );

  if (candidates.length === 0) {
    fail("Nenhum candidato a webhook encontrado.");
    return;
  }

  for (const [file, text] of candidates) {
    if (
      text.includes("stripe.webhooks.constructEvent") ||
      text.includes(".webhooks.constructEvent")
    ) {
      ok(`${file}: valida assinatura do webhook com constructEvent.`);
    } else if (file.toLowerCase().includes("webhook")) {
      warn(`${file}: webhook encontrado, mas não localizei constructEvent.`);
    }

    if (text.includes("STRIPE_WEBHOOK_SECRET")) {
      ok(`${file}: usa STRIPE_WEBHOOK_SECRET.`);
    }

    const events = [
      "checkout.session.completed",
      "customer.subscription.created",
      "customer.subscription.updated",
      "customer.subscription.deleted",
      "invoice.payment_succeeded",
      "invoice.payment_failed",
    ];

    for (const event of events) {
      if (text.includes(event)) {
        ok(`${file}: trata evento ${event}`);
      }
    }

    if (text.includes("subscriptions") && text.includes("upsert")) {
      ok(`${file}: grava/atualiza tabela subscriptions.`);
    } else if (text.includes("subscriptions")) {
      warn(`${file}: referencia subscriptions, mas não localizei upsert.`);
    }
  }
}

function checkPremiumAccess() {
  title("Liberação de acesso premium");

  const premiumCandidates = findFilesContaining([
    "verifyPremiumAccess",
    "subscriptions",
    "premium",
    "planify_access",
  ]);

  if (premiumCandidates.length > 0) {
    ok(`Arquivos de acesso premium encontrados: ${premiumCandidates.length}`);
  } else {
    fail("Não encontrei arquivos de acesso premium.");
  }

  for (const file of premiumCandidates.slice(0, 25)) {
    const text = read(file);

    if (file.includes("premium-access-service") || text.includes("verifyPremiumAccess")) {
      report.push(`   - ${file}`);
    }
  }

  const accessRoute = read("src/app/api/access/status/route.ts");

  if (accessRoute.includes("verifyPremiumAccess")) {
    ok("/api/access/status usa verifyPremiumAccess.");
  } else {
    warn("/api/access/status não parece usar verifyPremiumAccess.");
  }

  if (accessRoute.includes("planify_owner_access")) {
    ok("/api/access/status mantém acesso interno do proprietário.");
  } else {
    warn("/api/access/status não menciona planify_owner_access.");
  }

  const service = read("src/server/auth/premium-access-service.ts");

  if (service.includes("subscriptions")) {
    ok("premium-access-service consulta subscriptions.");
  } else {
    warn("premium-access-service não parece consultar subscriptions.");
  }

  const activeWords = ["active", "trialing", "past_due", "canceled", "incomplete"];

  for (const word of activeWords) {
    if (service.includes(word)) {
      ok(`premium-access-service contém status: ${word}`);
    }
  }
}

function checkSecretExposure() {
  title("Exposição de chaves no frontend");

  const files = listFiles(path.join(root, "src"))
    .filter(isTextFile)
    .map((file) => [relative(file), fs.readFileSync(file, "utf8")]);

  const clientFilesWithSecret = [];

  for (const [file, text] of files) {
    const normalized = file.toLowerCase();
    const isClientLikely =
      normalized.endsWith(".tsx") ||
      normalized.includes("/components/") ||
      normalized.includes("/app/");

    const isServerRoute = normalized.includes("/api/") || text.includes("server-only");
    const hasSecret =
      text.includes("STRIPE_SECRET_KEY") ||
      text.includes("STRIPE_WEBHOOK_SECRET") ||
      text.includes("SUPABASE_SERVICE_ROLE_KEY");

    if (isClientLikely && !isServerRoute && hasSecret) {
      clientFilesWithSecret.push(file);
    }
  }

  if (clientFilesWithSecret.length === 0) {
    ok("Não encontrei uso direto de chaves secretas em arquivos visuais/client.");
  } else {
    fail(`Possível exposição de chave secreta em: ${clientFilesWithSecret.join(", ")}`);
  }
}

function checkDatabaseScripts() {
  title("Banco de dados / subscriptions");

  const files = listFiles(path.join(root, "database")).filter(isTextFile);

  if (files.length === 0) {
    warn("Pasta database vazia ou inexistente.");
    return;
  }

  const subscriptionScripts = files
    .map((file) => [relative(file), fs.readFileSync(file, "utf8")])
    .filter(([, text]) => text.includes("subscriptions"));

  if (subscriptionScripts.length > 0) {
    ok(`Scripts SQL com subscriptions encontrados: ${subscriptionScripts.map(([file]) => file).join(", ")}`);
  } else {
    warn("Nenhum SQL com subscriptions encontrado na pasta database.");
  }

  for (const [file, text] of subscriptionScripts) {
    if (text.includes("create table") && text.includes("subscriptions")) {
      ok(`${file}: cria tabela subscriptions.`);
    }

    if (text.includes("enable row level security")) {
      ok(`${file}: ativa RLS.`);
    }

    if (text.includes("stripe_customer_id") || text.includes("customer_id")) {
      ok(`${file}: contém customer_id.`);
    }

    if (text.includes("current_period_end")) {
      ok(`${file}: contém current_period_end.`);
    }

    if (text.includes("status")) {
      ok(`${file}: contém status.`);
    }
  }
}

function checkOnlineInstructions() {
  title("Teste manual recomendado");

  report.push("1. Em modo teste Stripe, compre o plano mensal com cartão de teste.");
  report.push("2. Confirme que o Stripe dispara checkout.session.completed.");
  report.push("3. Confirme que a tabela subscriptions recebe/atualiza a assinatura.");
  report.push("4. Faça login com o e-mail comprador.");
  report.push("5. Abra /api/access/status e confirme premium=true.");
  report.push("6. Abra /dashboard, /planejamentos, /materiais e /biblioteca.");
  report.push("7. Cancele a assinatura no Stripe test.");
  report.push("8. Reenvie ou aguarde webhook customer.subscription.updated/deleted.");
  report.push("9. Confirme que premium=false para usuário comum sem assinatura ativa.");
}

function writeReport() {
  const outDir = path.join(root, "docs", "auditorias");
  fs.mkdirSync(outDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outFile = path.join(outDir, `auditoria-stripe-assinaturas-${stamp}.md`);

  const header = [
    "# Planify — Auditoria Stripe e Assinaturas",
    "",
    `Data: ${new Date().toLocaleString("pt-BR")}`,
    "",
    "## Resultado geral",
    "",
    failures > 0
      ? `[ERRO] ${failures} falha(s) encontrada(s). Corrigir antes do deploy.`
      : warnings > 0
        ? `[AVISO] Sem falhas críticas, mas com ${warnings} aviso(s) para revisar.`
        : "[OK] Sem falhas ou avisos relevantes.",
    "",
  ];

  fs.writeFileSync(outFile, [...header, ...report, ""].join("\n"), "utf8");

  console.log("");
  console.log("===============================================");
  console.log("Planify | Auditoria Stripe e Assinaturas");
  console.log("===============================================");
  console.log("");
  console.log(
    failures > 0
      ? `Resultado: FALHAS (${failures}) E AVISOS (${warnings})`
      : warnings > 0
        ? `Resultado: OK COM AVISOS (${warnings})`
        : "Resultado: OK"
  );
  console.log("");
  console.log(`Relatório salvo em: ${outFile}`);
  console.log("");

  if (failures > 0) {
    process.exitCode = 1;
  }
}

checkPackage();
const env = checkEnv();
checkRoutes();
checkWebhookImplementation();
checkPremiumAccess();
checkSecretExposure();
checkDatabaseScripts();
checkOnlineInstructions();
writeReport();
