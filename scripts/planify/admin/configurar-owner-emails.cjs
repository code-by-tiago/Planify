/**
 * Adiciona e-mails à lista de owners/admin no .env.local (não altera Vercel).
 *
 * Uso:
 *   node scripts/planify/admin/configurar-owner-emails.cjs --add "email@escola.edu.br"
 */
const fs = require("node:fs");
const path = require("node:path");
const { getArg, loadPlanifyEnv } = require("./_env.cjs");

const KEYS = [
  "PLANIFY_ADMIN_EMAIL",
  "PLANIFY_OWNER_EMAILS",
  "NEXT_PUBLIC_ADMIN_EMAIL",
];

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function parseEmailList(value) {
  return String(value || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function mergeEmails(existing, incoming) {
  const email = normalizeEmail(incoming);
  if (!email) {
    return parseEmailList(existing);
  }
  return [...new Set([...parseEmailList(existing), email])];
}

function upsertEnvLine(content, key, emails) {
  const value = emails.join(",");
  const pattern = new RegExp(`^${key}=.*$`, "m");
  const line = `${key}=${value}`;

  if (pattern.test(content)) {
    return content.replace(pattern, line);
  }

  const suffix = content.endsWith("\n") || content.length === 0 ? "" : "\n";
  return `${content}${suffix}${line}\n`;
}

function main() {
  const addEmail = normalizeEmail(getArg("--add"));

  if (!addEmail) {
    console.error("Informe --add com o e-mail a incluir na lista de owners.");
    process.exit(1);
  }

  const projectRoot = process.cwd();
  loadPlanifyEnv(projectRoot);

  const envPath = path.join(projectRoot, ".env.local");
  let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";

  for (const key of KEYS) {
    const current = process.env[key] || "";
    const merged = mergeEmails(current, addEmail);
    content = upsertEnvLine(content, key, merged);
    process.env[key] = merged.join(",");
  }

  fs.writeFileSync(envPath, content, "utf8");

  console.log("");
  console.log("Owners atualizados no .env.local:");
  for (const key of KEYS) {
    console.log(`  ${key}=${process.env[key]}`);
  }
  console.log("");
  console.log(
    "Produção (Vercel): adicione o mesmo e-mail, separado por vírgula, em",
  );
  console.log("PLANIFY_ADMIN_EMAIL, PLANIFY_OWNER_EMAILS e NEXT_PUBLIC_ADMIN_EMAIL.");
  console.log("Depois faça Redeploy do projeto.");
  console.log("");
}

main();
