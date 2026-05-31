const fs = require("node:fs");
const path = require("node:path");

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

async function main() {
  const root = process.cwd();
  const env = {
    ...parseEnvFile(path.join(root, ".env.local")),
    ...process.env,
  };

  const secret = env.STRIPE_SECRET_KEY;

  console.log("");
  console.log("Planify | Stripe Probe");
  console.log("");

  if (!secret) {
    console.error("ERRO: STRIPE_SECRET_KEY ausente.");
    process.exit(1);
  }

  let Stripe;

  try {
    Stripe = require("stripe");
  } catch {
    console.error("ERRO: pacote stripe não encontrado. Rode npm install.");
    process.exit(1);
  }

  const stripe = new Stripe(secret);

  console.log(`Chave usada: ${mask(secret)}`);

  try {
    const account = await stripe.accounts.retrieve();

    console.log(`[OK] Conectado ao Stripe: ${account.id}`);
    console.log(`[OK] País: ${account.country || "não informado"}`);
    console.log(`[OK] Charges enabled: ${account.charges_enabled}`);
    console.log(`[OK] Payouts enabled: ${account.payouts_enabled}`);
  } catch (error) {
    console.error("[ERRO] Não foi possível conectar ao Stripe.");
    console.error(error.message || error);
    process.exit(1);
  }

  const priceEnvKeys = Object.keys(env).filter((key) => /^price_/.test(env[key] || ""));

  if (priceEnvKeys.length === 0) {
    console.log("[AVISO] Nenhum price_ encontrado no .env.local por valor.");
  } else {
    console.log("");
    console.log("Verificando Price IDs:");

    for (const key of priceEnvKeys) {
      try {
        const price = await stripe.prices.retrieve(env[key]);

        console.log(
          `[OK] ${key}: ${price.id} | ${price.active ? "ativo" : "inativo"} | ${price.currency} ${price.unit_amount} | ${price.recurring?.interval || "único"}`
        );
      } catch (error) {
        console.log(`[ERRO] ${key}: ${env[key]} não pôde ser lido. ${error.message || error}`);
      }
    }
  }

  console.log("");
  console.log("Probe concluído.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
