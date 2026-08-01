const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();

const files = [
  "src/app/api/stripe/webhook/route.ts",
  "src/server/stripe/webhook-service.ts",
  "src/server/stripe/stripe-api.ts",
  "src/server/stripe/index.ts",
  "src/config/env.ts",
];

function read(relativePath) {
  const file = path.join(root, relativePath);

  if (!fs.existsSync(file)) {
    return "";
  }

  return fs.readFileSync(file, "utf8");
}

function showMatches(relativePath, patterns) {
  const text = read(relativePath);

  if (!text) {
    console.log(`[AVISO] Arquivo ausente: ${relativePath}`);
    return;
  }

  const lines = text.split(/\r?\n/);
  const matched = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (patterns.some((pattern) => pattern.test(line))) {
      matched.push(index);
    }
  }

  console.log("");
  console.log(`## ${relativePath}`);

  if (matched.length === 0) {
    console.log("Nenhuma linha relevante encontrada.");
    return;
  }

  const printed = new Set();

  for (const index of matched) {
    const start = Math.max(0, index - 5);
    const end = Math.min(lines.length - 1, index + 5);

    for (let i = start; i <= end; i += 1) {
      const key = `${relativePath}:${i}`;

      if (printed.has(key)) {
        continue;
      }

      printed.add(key);
      console.log(`${String(i + 1).padStart(4, " ")} | ${lines[i]}`);
    }

    console.log("----");
  }
}

console.log("");
console.log("Planify | Inspecao Stripe Webhook");
console.log("");

for (const file of files) {
  showMatches(file, [
    /constructEvent/i,
    /webhook/i,
    /signature/i,
    /STRIPE_WEBHOOK_SECRET/,
    /checkout\.session\.completed/,
    /customer\.subscription/,
    /subscriptions/,
    /upsert/,
    /raw/i,
    /headers\(/i,
    /stripe-signature/i,
  ]);
}

console.log("");
console.log("Inspecao concluida.");
console.log("Envie este resultado se ainda houver aviso de constructEvent na auditoria Stripe.");
