const fs = require("node:fs");
const path = require("node:path");
const childProcess = require("node:child_process");

const root = process.cwd();

let failures = 0;
let warnings = 0;
const report = [];

function ok(message) {
  report.push(`[OK] ${message}`);
}

function warn(message) {
  warnings += 1;
  report.push(`[AVISO] ${message}`);
}

function fail(message) {
  failures += 1;
  report.push(`[ERRO] ${message}`);
}

function title(message) {
  report.push("");
  report.push(`## ${message}`);
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

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (["node_modules", ".next", ".git", ".vercel", "dist", "out", ".turbo"].includes(entry.name)) {
        continue;
      }

      walk(full, files);
    } else {
      files.push(full);
    }
  }

  return files;
}

function run(command) {
  try {
    return childProcess.execSync(command, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch (error) {
    return "";
  }
}

function rel(file) {
  return path.relative(root, file).replaceAll("\\", "/");
}

function mask(value) {
  if (!value) return "";
  if (value.length <= 12) return `${value.slice(0, 3)}***`;
  return `${value.slice(0, 7)}...${value.slice(-4)}`;
}

function shouldScan(file) {
  const r = rel(file);

  if (r.includes(".bak-")) return false;
  if (r.startsWith("node_modules/")) return false;
  if (r.startsWith(".next/")) return false;
  if (r.startsWith(".git/")) return false;
  if (r.startsWith(".vercel/")) return false;
  if (r === ".env.local" || r === ".env" || /^\.env\./.test(r)) return false;
  if (r.endsWith(".zip") || r.endsWith(".png") || r.endsWith(".jpg") || r.endsWith(".jpeg") || r.endsWith(".webp")) return false;
  if (r.endsWith(".docx") || r.endsWith(".pdf") || r.endsWith(".mp4")) return false;

  return true;
}

const secretPatterns = [
  {
    name: "Stripe secret key",
    regex: /\bsk_(?:live|test)_[A-Za-z0-9]{12,}\b/g,
    severity: "fail",
  },
  {
    name: "Stripe webhook secret",
    regex: /\bwhsec_[A-Za-z0-9]{12,}\b/g,
    severity: "fail",
  },
  {
    name: "Supabase service role key",
    regex: /\bsb_(?:secret|sec)_[A-Za-z0-9_\-]{20,}\b/g,
    severity: "fail",
  },
  {
    name: "Google API key / Gemini key",
    regex: /\bAIza[A-Za-z0-9_\-]{30,}\b/g,
    severity: "fail",
  },
  {
    name: "Google OAuth client secret",
    regex: /\bGOCSPX-[A-Za-z0-9_\-]{10,}\b/g,
    severity: "fail",
  },
  {
    name: "JWT-like token",
    regex: /\beyJ[A-Za-z0-9_\-]{20,}\.[A-Za-z0-9_\-]{20,}\.[A-Za-z0-9_\-]{20,}\b/g,
    severity: "warn",
  },
  {
    name: "Private key block",
    regex: /-----BEGIN (?:RSA |EC |OPENSSH |)PRIVATE KEY-----/g,
    severity: "fail",
  },
];

title("Git ignore and env protection");

const gitignore = read(".gitignore");

if (!gitignore) {
  fail(".gitignore not found.");
} else {
  for (const required of [".env", ".env.*", "!.env.example", "node_modules/", ".next/", ".vercel/"]) {
    if (gitignore.includes(required)) ok(`.gitignore contains: ${required}`);
    else fail(`.gitignore missing: ${required}`);
  }
}

if (exists(".env.example")) ok(".env.example exists.");
else fail(".env.example not found.");

if (exists(".env.local")) {
  ok(".env.local exists locally.");

  const ignored = run("git check-ignore .env.local");
  if (ignored) ok(".env.local is ignored by Git.");
  else warn("Could not confirm .env.local is ignored. If this is not a Git repo yet, run the audit again after git init.");
} else {
  warn(".env.local not found. Production deploy will need environment variables configured.");
}

title("Secret scan");

const files = walk(root).filter(shouldScan);
const findings = [];

for (const file of files) {
  let content = "";

  try {
    content = fs.readFileSync(file, "utf8");
  } catch {
    continue;
  }

  for (const pattern of secretPatterns) {
    pattern.regex.lastIndex = 0;

    const matches = content.match(pattern.regex);
    if (!matches?.length) continue;

    for (const match of [...new Set(matches)]) {
      findings.push({
        file: rel(file),
        name: pattern.name,
        severity: pattern.severity,
        value: mask(match),
      });
    }
  }
}

if (findings.length === 0) {
  ok("No hardcoded secrets found in scanned files.");
} else {
  for (const item of findings) {
    const message = `${item.name} found in ${item.file}: ${item.value}`;

    if (item.severity === "fail") fail(message);
    else warn(message);
  }
}

title("Public keys allowed check");

const appTextFiles = files.filter((file) => /\.(tsx|ts|jsx|js|cjs|mjs|css|json|md|sql)$/.test(file));
let publishableKeyRefs = 0;

for (const file of appTextFiles) {
  const content = fs.readFileSync(file, "utf8");
  if (content.includes("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY")) publishableKeyRefs += 1;
}

if (publishableKeyRefs > 0) ok("Public Stripe key references are present through NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.");
else warn("No NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY reference found. This is only a warning.");

title("Result");

const outDir = path.join(root, "docs", "auditorias");
fs.mkdirSync(outDir, { recursive: true });

const file = path.join(
  outDir,
  `auditoria-anti-vazamento-9-21-0-${new Date().toISOString().replace(/[:.]/g, "-")}.md`,
);

const header = [
  "# Planify — Auditoria anti-vazamento 9.21.0",
  "",
  `Data: ${new Date().toLocaleString("pt-BR")}`,
  "",
  failures > 0
    ? `[ERRO] ${failures} falha(s). NAO fazer push antes de corrigir.`
    : warnings > 0
      ? `[AVISO] Sem falhas criticas, mas com ${warnings} aviso(s).`
      : "[OK] Seguro para preparar GitHub.",
  "",
];

fs.writeFileSync(file, `${[...header, ...report].join("\n")}\n`, "utf8");

console.log("");
console.log("===============================================");
console.log("Planify | Auditoria anti-vazamento 9.21.0");
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
console.log(`Relatorio salvo em: ${file}`);
console.log("");

if (failures > 0) {
  process.exitCode = 1;
}
