const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const ignoredDirs = new Set(["node_modules", ".next", ".git", "dist", "build"]);
const suspiciousPatterns = [
  /sk_live_[A-Za-z0-9_]+/g,
  /sk_test_[A-Za-z0-9_]+/g,
  /whsec_[A-Za-z0-9_]+/g,
  /sb_secret_[A-Za-z0-9_]+/g,
  /SUPABASE_SERVICE_ROLE_KEY\s*=/g,
  /GEMINI_API_KEY\s*=/g,
  /STRIPE_SECRET_KEY\s*=/g,
];

const requiredFiles = [
  ".gitignore",
  ".env.local",
  "package.json",
  "src/app/admin/biblioteca/page.tsx",
  "src/app/api/admin/biblioteca/materiais/route.ts",
  "src/app/api/biblioteca/materiais/route.ts",
];

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;

    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(full, acc);
    } else {
      acc.push(full);
    }
  }

  return acc;
}

function readSafe(file) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return "";
  }
}

const report = [];
report.push("# Planify — Auditoria pré-GitHub");
report.push("");
report.push(`Data: ${new Date().toISOString()}`);
report.push("");

report.push("## Arquivos obrigatórios");
for (const file of requiredFiles) {
  report.push(`- ${fs.existsSync(path.join(root, file)) ? "OK" : "FALTA"} ${file}`);
}

report.push("");
report.push("## .gitignore");
const gitignore = readSafe(path.join(root, ".gitignore"));
const gitignoreChecks = [".env", ".env.local", "node_modules", ".next"];

for (const item of gitignoreChecks) {
  report.push(`- ${gitignore.includes(item) ? "OK" : "ATENÇÃO"} ${item}`);
}

report.push("");
report.push("## Busca por segredos em arquivos de código");
const files = walk(root).filter((file) => /\.(ts|tsx|js|jsx|json|md|sql|ps1|cjs)$/.test(file));
const findings = [];

for (const file of files) {
  const relative = path.relative(root, file);

  if (relative === ".env.local") continue;

  const text = readSafe(file);

  for (const pattern of suspiciousPatterns) {
    const matches = text.match(pattern);

    if (matches?.length) {
      findings.push(`${relative}: ${matches[0].slice(0, 24)}...`);
    }
  }
}

if (findings.length === 0) {
  report.push("- OK: nenhum segredo óbvio encontrado fora do .env.local");
} else {
  for (const finding of findings) {
    report.push(`- ATENÇÃO: ${finding}`);
  }
}

report.push("");
report.push("## Próximos passos");
report.push("- Rodar npm run build");
report.push("- Testar /admin/biblioteca");
report.push("- Testar /biblioteca");
report.push("- Confirmar upload e download de anexo");
report.push("- Só depois criar commit GitHub");

const out = path.join(root, "tmp", "auditoria-pre-github.md");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, report.join("\n"), "utf8");

console.log("");
console.log("Auditoria gerada:");
console.log(out);
console.log("");
