const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

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

function parseEnv(content) {
  const map = new Map();

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const index = trimmed.indexOf("=");
    if (index === -1) continue;

    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();

    map.set(key, value);
  }

  return map;
}

title("Google OAuth env readiness");

const envLocal = parseEnv(read(".env.local"));
const envExample = parseEnv(read(".env.example"));

const googleKeys = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_REDIRECT_URI",
  "GOOGLE_DRIVE_FOLDER_ID",
];

for (const key of googleKeys) {
  if (envExample.has(key)) ok(`.env.example contains ${key}`);
  else warn(`.env.example missing ${key}`);

  if (envLocal.has(key) && envLocal.get(key)) {
    ok(`.env.local has ${key} configured.`);
  } else {
    warn(`.env.local does not have ${key} configured yet.`);
  }
}

title("Google export routes");

const requiredRoutes = [
  "src/app/api/google/oauth/start/route.ts",
  "src/app/api/google/oauth/callback/route.ts",
  "src/app/api/google/classroom/auth/route.ts",
  "src/app/api/google/classroom/callback/route.ts",
  "src/app/api/google/classroom/share/route.ts",
  "src/app/api/google/classroom/export/route.ts",
  "src/app/api/google/classroom/courses/route.ts",
  "src/app/api/google/drive/export/route.ts",
];

for (const route of requiredRoutes) {
  if (exists(route)) ok(`Route found: ${route}`);
  else fail(`Missing route: ${route}`);
}

title("Classroom export safety invariants");

const hook = read("src/hooks/useGoogleClassroomExport.ts");
const popover = read("src/components/google/GoogleClassroomPopoverButton.tsx");
const route = read("src/server/google/classroom-share-api.ts");

if (/handleQuickExport/.test(hook)) fail("handleQuickExport still exported from hook");
else ok("No handleQuickExport in classroom hook");

if (/GoogleClassroomExportButton/.test(read("src/components/google/GoogleDocumentExportBar.tsx"))) {
  fail("GoogleClassroomExportButton still referenced in export bar");
} else ok("Export bar uses popover/panel flow");

if (/Enviar ao Classroom/.test(popover) && /GoogleClassroomShareModal/.test(popover)) {
  ok("Classroom button opens premium review modal");
} else fail("Classroom button missing review modal UX");

if (/classroom-export-persistent-guard/.test(route)) {
  ok("Classroom export API uses persistent dedup guard");
} else fail("Classroom export API missing persistent dedup guard");

if (exists("supabase/migrations/20260628180000_google_classroom_export_guards.sql")) {
  ok("Supabase migration for classroom dedup present");
} else warn("Supabase migration for classroom dedup not found locally");

if (exists("scripts/verify-classroom-export-safety.mjs")) {
  try {
    execSync("node scripts/verify-classroom-export-safety.mjs", {
      cwd: root,
      stdio: "pipe",
    });
    ok("verify:classroom-export-safety passed");
  } catch (error) {
    fail("verify:classroom-export-safety failed");
  }
} else {
  fail("scripts/verify-classroom-export-safety.mjs missing");
}

title("Recommended safe implementation order");

report.push("1. OAuth start/callback with tokens server-side only.");
report.push("2. Drive export stable before Classroom API publish.");
report.push("3. Classroom: listar turmas reais e publicar somente apos confirmacao.");
report.push("4. Dedup persistente Supabase + rate limit no API.");
report.push("5. Manter download DOCX/PDF como fallback.");

const outDir = path.join(root, "docs", "auditorias");
fs.mkdirSync(outDir, { recursive: true });

const file = path.join(
  outDir,
  `auditoria-google-classroom-ready-9-21-0-${new Date().toISOString().replace(/[:.]/g, "-")}.md`,
);

const header = [
  "# Planify — Auditoria Google Drive/Classroom readiness 9.21.0",
  "",
  `Data: ${new Date().toLocaleString("pt-BR")}`,
  "",
  failures > 0
    ? `[ERRO] ${failures} falha(s).`
    : warnings > 0
      ? `[AVISO] Sem falhas criticas, mas com ${warnings} aviso(s).`
      : "[OK] Pronto para integrar Drive/Classroom.",
  "",
];

fs.writeFileSync(file, `${[...header, ...report].join("\n")}\n`, "utf8");

console.log("");
console.log("===============================================");
console.log("Planify | Google Drive/Classroom readiness");
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
