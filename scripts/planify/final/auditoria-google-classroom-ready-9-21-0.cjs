const fs = require("node:fs");
const path = require("node:path");

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

title("Routes currently available");

const possibleRoutes = [
  "src/app/api/google/oauth/start/route.ts",
  "src/app/api/google/oauth/callback/route.ts",
  "src/app/api/google/classroom/export/route.ts",
  "src/app/api/google/drive/export/route.ts",
  "src/app/api/classroom/export/route.ts",
  "src/app/api/drive/export/route.ts",
];

let foundAnyRoute = false;

for (const route of possibleRoutes) {
  if (exists(route)) {
    ok(`Google export route found: ${route}`);
    foundAnyRoute = true;
  }
}

if (!foundAnyRoute) {
  warn("No Google Drive/Classroom export route found yet. This is expected if the real integration is the next implementation step.");
}

title("Recommended safe implementation order");

report.push("1. Implement OAuth start/callback without touching DOCX generation.");
report.push("2. Store tokens server-side only.");
report.push("3. Export already-generated DOCX to Drive first.");
report.push("4. Add Classroom share/publish only after Drive export is stable.");
report.push("5. Keep the existing DOCX download as fallback.");

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
