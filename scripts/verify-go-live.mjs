#!/usr/bin/env node
/**
 * Gate de go-live — smoke estático + scripts verify principais.
 * Run: npm run verify:go-live
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
let failed = 0;

function fail(message) {
  console.error(`FAIL  ${message}`);
  failed += 1;
}

function ok(message) {
  console.log(`OK    ${message}`);
}

function runStep(command) {
  console.log(`\n→ ${command}`);
  const [cmd, ...args] = command.split(" ");
  const result = spawnSync(cmd, args, { cwd: root, stdio: "inherit", shell: true });
  if (result.status !== 0) {
    fail(`step failed: ${command}`);
  }
}

function read(relative) {
  return readFileSync(join(root, relative), "utf8");
}

// --- Static checks ---
const proxy = read("src/proxy.ts");
if (proxy.includes("/comunidade") && proxy.includes("allowGracePass")) {
  ok("proxy protege /comunidade com grace premium");
} else {
  fail("proxy.ts incompleto (comunidade/grace)");
}

for (const route of ["/aula-completa", "/correcao", "/banco-questoes"]) {
  if (proxy.includes(`"${route}"`)) {
    ok(`proxy protege ${route}`);
  } else {
    fail(`proxy.ts não protege ${route}`);
  }
}

if (!read("src/proxy.ts").includes("127.0.0.1:7616")) {
  ok("sem telemetria debug no proxy");
} else {
  fail("telemetria debug ainda presente");
}

if (existsSync("src/app/(app)/error.tsx")) {
  ok("error boundary (app) presente");
} else {
  fail("falta src/app/(app)/error.tsx");
}

if (!existsSync("src/app/login/LoginClient.tsx")) {
  ok("LoginClient legado removido");
} else {
  fail("LoginClient legado ainda existe");
}

const layout = read("src/app/(app)/layout.tsx");
if (layout.includes("PremiumAccessGate") && !layout.includes("PremiumRouteGuard")) {
  ok("gate premium centralizado no layout (app)");
} else {
  fail("layout (app) sem PremiumAccessGate centralizado");
}

function walkPages(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walkPages(full, acc);
    else if (entry === "page.tsx") acc.push(full);
  }
  return acc;
}

const appRoot = join(root, "src", "app", "(app)");
let duplicateGates = 0;
for (const pagePath of walkPages(appRoot)) {
  if (pagePath.endsWith("layout.tsx")) continue;
  const page = readFileSync(pagePath, "utf8");
  if (page.includes("PremiumAccessGate")) {
    fail(`gate duplicado em ${pagePath.replace(root, "")}`);
    duplicateGates += 1;
  }
}
if (duplicateGates === 0) {
  ok("nenhuma page (app) com PremiumAccessGate duplicado");
}

const envExample = read(".env.example");
for (const key of [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "GEMINI_API_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
]) {
  if (envExample.includes(key)) {
    ok(`.env.example contém ${key}`);
  } else {
    fail(`.env.example falta ${key}`);
  }
}

if (read("instrumentation-client.ts").includes("Sentry.init")) {
  ok("Sentry client init em instrumentation-client.ts");
} else {
  fail("instrumentation-client.ts sem Sentry.init");
}

// --- Verify suites ---
const steps = [
  "npm run verify:material-quality",
  "npm run verify:generators",
  "npm run verify:export-pipeline",
  "npm run verify:prova-engine-contract",
  "npm run verify:question-bank-match",
  "npm run verify:planejamento-docx",
  "npm run verify:comunidade-docente",
  "node scripts/verify-export-motors.mjs",
  "node scripts/verify-forms-export-payload.mjs",
  "node scripts/verify-google-export-readiness.mjs",
];

for (const step of steps) {
  runStep(step);
}

console.log("");
if (failed > 0) {
  console.error(`verify:go-live FAILED (${failed} issue(s))`);
  process.exit(1);
}

console.log("verify:go-live: OK — pronto para deploy");
process.exit(0);
