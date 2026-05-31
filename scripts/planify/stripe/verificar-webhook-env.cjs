const fs = require("node:fs");
const path = require("node:path");

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const env = {};
  const content = fs.readFileSync(filePath, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const index = line.indexOf("=");

    if (index <= 0) {
      continue;
    }

    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();

    env[key] = value;
  }

  return env;
}

const env = loadEnv(path.join(process.cwd(), ".env.local"));

const checks = [
  ["STRIPE_SECRET_KEY", (value) => value.startsWith("sk_live_") || value.startsWith("sk_test_")],
  ["STRIPE_WEBHOOK_SECRET", (value) => value.startsWith("whsec_") && value.length > 20],
  ["SUPABASE_SERVICE_ROLE_KEY", (value) => value.length > 20],
  ["NEXT_PUBLIC_SUPABASE_URL", (value) => value.startsWith("https://") && value.includes(".supabase.co")],
];

console.log("");
console.log("Planify | Verificação de ambiente Stripe Webhook");
console.log("");

for (const [key, validate] of checks) {
  const value = env[key] || "";
  const ok = Boolean(value) && validate(value);

  console.log(`${key}: ${ok ? "OK" : "PENDENTE"}`);
}

console.log("");
console.log("Observação: não exiba chaves secretas no chat.");
