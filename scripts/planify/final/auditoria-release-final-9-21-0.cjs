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

title("Package and build scripts");

const packageJson = read("package.json");
if (!packageJson) {
  fail("package.json not found.");
} else {
  try {
    const pkg = JSON.parse(packageJson);
    if (pkg.scripts?.build) ok("package.json has build script.");
    else fail("package.json missing build script.");

    if (pkg.scripts?.dev) ok("package.json has dev script.");
    else warn("package.json missing dev script.");

    if (pkg.dependencies?.next || pkg.devDependencies?.next) ok("Next.js dependency found.");
    else warn("Next.js dependency not found in package.json.");

    if (pkg.dependencies?.["@supabase/supabase-js"] || pkg.devDependencies?.["@supabase/supabase-js"]) {
      ok("Supabase dependency found.");
    } else {
      warn("Supabase dependency not found in package.json.");
    }

    if (pkg.dependencies?.stripe || pkg.devDependencies?.stripe) {
      ok("Stripe dependency found.");
    } else {
      warn("Stripe dependency not found in package.json. If Stripe is used only through fetch/manual validation, confirm manually.");
    }
  } catch (error) {
    fail("package.json is not valid JSON.");
  }
}

title("Routes");

const routes = [
  "src/app/page.tsx",
  "src/app/planos/page.tsx",
  "src/app/login/page.tsx",
  "src/app/dashboard/page.tsx",
  "src/app/planejamentos/page.tsx",
  "src/app/materiais/page.tsx",
  "src/app/editor/page.tsx",
  "src/app/biblioteca/page.tsx",
  "src/app/marketplace/page.tsx",
  "src/app/admin/page.tsx",
  "src/app/admin/biblioteca/page.tsx",
  "src/app/contato/page.tsx",
];

for (const route of routes) {
  if (exists(route)) ok(`Route exists: ${route}`);
  else warn(`Route not found directly: ${route}`);
}

title("Sensitive server routes");

const sensitiveRoutes = [
  "src/app/api/planejamentos/gerar/route.ts",
  "src/app/api/planejamentos/docx-pacote/route.ts",
  "src/app/api/stripe/checkout/route.ts",
  "src/app/api/stripe/webhook/route.ts",
  "src/app/api/access/status/route.ts",
  "src/app/api/biblioteca/materiais/route.ts",
  "src/app/api/marketplace/materiais/route.ts",
];

for (const route of sensitiveRoutes) {
  if (exists(route)) ok(`Sensitive route found: ${route}`);
  else warn(`Sensitive route not found at expected path: ${route}`);
}

title("Env example");

const envExample = read(".env.example");
const requiredEnvKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "GEMINI_API_KEY",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_PRO_MONTHLY",
  "STRIPE_PRICE_PRO_YEARLY",
  "PLANIFY_ADMIN_EMAIL",
  "NEXT_PUBLIC_ADMIN_EMAIL",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_REDIRECT_URI",
];

for (const key of requiredEnvKeys) {
  if (envExample.includes(`${key}=`)) ok(`.env.example includes ${key}`);
  else warn(`.env.example missing ${key}`);
}

title("Large files warning");

const allFiles = walk(root);
const largeFiles = [];

for (const file of allFiles) {
  try {
    const stat = fs.statSync(file);
    if (stat.size > 25 * 1024 * 1024) {
      largeFiles.push({
        file: path.relative(root, file).replaceAll("\\", "/"),
        mb: Math.round((stat.size / 1024 / 1024) * 10) / 10,
      });
    }
  } catch {}
}

if (largeFiles.length === 0) {
  ok("No local files above 25MB found outside ignored folders.");
} else {
  warn("Large files found. Consider Git LFS or remove before push:");
  report.push("```text");
  for (const item of largeFiles) report.push(`${item.mb} MB - ${item.file}`);
  report.push("```");
}

title("Git status");

const gitVersion = run("git --version");
if (!gitVersion) {
  warn("Git not found or not available in PATH.");
} else {
  ok(gitVersion);
  const status = run("git status --short");

  if (status) {
    warn("There are changed/new files pending commit.");
    report.push("```text");
    report.push(status.slice(0, 7000));
    report.push("```");
  } else {
    ok("Git status is clean.");
  }
}

title("Manual final checklist");

for (const item of [
  "Open / and check final landing texts.",
  "Open /planos and confirm no technical Stripe text is visible.",
  "Open /planejamentos and test smart fields.",
  "Generate one simple annual planning DOCX.",
  "Open generated content in Editor.",
  "Open /biblioteca and download a real material.",
  "Open /marketplace and confirm listing/upload flow.",
  "Open /admin and /admin/biblioteca with owner account.",
  "Confirm .env.local is NOT committed.",
  "Configure production environment variables in deploy provider.",
]) {
  report.push(`- ${item}`);
}

const outDir = path.join(root, "docs", "auditorias");
fs.mkdirSync(outDir, { recursive: true });

const file = path.join(
  outDir,
  `auditoria-release-final-9-21-0-${new Date().toISOString().replace(/[:.]/g, "-")}.md`,
);

const header = [
  "# Planify — Auditoria release final 9.21.0",
  "",
  `Data: ${new Date().toLocaleString("pt-BR")}`,
  "",
  failures > 0
    ? `[ERRO] ${failures} falha(s). Corrigir antes de deploy.`
    : warnings > 0
      ? `[AVISO] Sem falhas criticas, mas com ${warnings} aviso(s).`
      : "[OK] Release final pronto.",
  "",
];

fs.writeFileSync(file, `${[...header, ...report].join("\n")}\n`, "utf8");

console.log("");
console.log("===============================================");
console.log("Planify | Auditoria release final 9.21.0");
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
