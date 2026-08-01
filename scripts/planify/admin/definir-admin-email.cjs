const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const envPath = path.join(root, ".env.local");
const adminEmail = process.argv[2] || "ts162351@gmail.com";

let text = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";

function upsertEnv(key, value) {
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, "m");

  if (pattern.test(text)) {
    text = text.replace(pattern, line);
  } else {
    text += `${text.endsWith("\n") || text.length === 0 ? "" : "\n"}${line}\n`;
  }
}

upsertEnv("PLANIFY_ADMIN_EMAIL", adminEmail);
upsertEnv("NEXT_PUBLIC_ADMIN_EMAIL", adminEmail);

fs.writeFileSync(envPath, text, "utf8");

console.log("");
console.log("OK: e-mail admin configurado no .env.local");
console.log(`PLANIFY_ADMIN_EMAIL=${adminEmail}`);
console.log(`NEXT_PUBLIC_ADMIN_EMAIL=${adminEmail}`);
console.log("");
console.log("IMPORTANTE:");
console.log("Pare o npm run dev antigo e inicie de novo depois do build.");
console.log("");
