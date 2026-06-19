#!/usr/bin/env node
/**
 * Gate Launch — checks estáticos acionáveis (itens 2–5, 7–9 do GATE-LAUNCH-CHECKLIST).
 * Run: npm run verify:gate-launch
 */
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

function read(relative) {
  return readFileSync(join(root, relative), "utf8");
}

function walkDir(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walkDir(full, acc);
    else acc.push(full);
  }
  return acc;
}

// --- 2. Fase 0: no debug localhost in src ---
const debugPatterns = [/127\.0\.0\.1:7616/, /localhost:7616/];
const srcFiles = walkDir(join(root, "src")).filter(
  (f) => f.endsWith(".ts") || f.endsWith(".tsx"),
);
let debugHits = 0;
for (const file of srcFiles) {
  const content = readFileSync(file, "utf8");
  for (const pattern of debugPatterns) {
    if (pattern.test(content)) {
      fail(`debug localhost em ${file.replace(root, "")}`);
      debugHits += 1;
    }
  }
}
if (debugHits === 0) {
  ok("Fase 0: sem telemetria/debug localhost em src/");
}

// --- 3. Fase 1: credits fail-closed ---
const genShared = read("src/server/generation/generation-api-shared.ts");
if (
  genShared.includes('"insufficient_credits"') &&
  genShared.includes("spend.status === \"insufficient\"") &&
  genShared.includes("402")
) {
  ok("Fase 1: créditos fail-closed em generation-api-shared");
} else {
  fail("Fase 1: generation-api-shared sem fail-closed de créditos");
}

for (const [route, needles] of [
  ["src/app/api/correcao/avaliar/route.ts", ["insufficient_credits"]],
  ["src/app/api/correcao/avaliar-lote/route.ts", ["insufficient_credits"]],
  [
    "src/app/api/materiais/gerar/route.ts",
    ["prepareGenerationRequest", "insufficientCreditsMessage"],
  ],
]) {
  const body = read(route);
  const missing = needles.filter((n) => !body.includes(n));
  if (missing.length === 0) {
    ok(`Fase 1: ${route.replace("src/", "")} trata créditos`);
  } else {
    fail(`Fase 1: ${route} falta ${missing.join(", ")}`);
  }
}

// --- 4. Fase 2: ToolStudioShell + ExportDock on lista/prova ---
const materiais = read("src/app/materiais/MateriaisClient.tsx");
if (
  materiais.includes("ToolStudioShell") &&
  materiais.includes("ExportDock") &&
  materiais.includes('tipo === "lista"') &&
  materiais.includes('tipo === "prova"') &&
  materiais.includes("useStudioExportDock")
) {
  ok("Fase 2: MateriaisClient com ToolStudioShell + ExportDock (lista/prova)");
} else {
  fail("Fase 2: MateriaisClient incompleto para studio lista/prova");
}

if (existsSync("src/components/studio/ToolStudioShell.tsx")) {
  ok("Fase 2: ToolStudioShell presente");
} else {
  fail("Fase 2: falta ToolStudioShell");
}

// --- 5. Export audit scripts exist ---
const exportScripts = [
  "scripts/verify-export-pipeline.mjs",
  "scripts/verify-export-motors.mjs",
  "scripts/verify-forms-export-payload.mjs",
  "scripts/verify-planejamento-docx.mjs",
];
for (const script of exportScripts) {
  if (existsSync(script)) {
    ok(`Export audit: ${script}`);
  } else {
    fail(`Export audit: falta ${script}`);
  }
}

// --- 7. Login/signup routes + proxy ---
if (existsSync("src/app/login/page.tsx") && existsSync("src/app/login/LoginPageClient.tsx")) {
  ok("Login: rotas /login presentes");
} else {
  fail("Login: rotas ausentes");
}

const loginPage = read("src/app/login/page.tsx");
if (loginPage.includes('params.mode === "signup"') && loginPage.includes('redirect("/planos")')) {
  ok("Signup: redireciona mode=signup → /planos");
} else {
  fail("Signup: fluxo mode=signup incompleto");
}

const proxy = read("src/proxy.ts");
if (proxy.includes("redirectToLogin") && proxy.includes("verifyPremiumAccess")) {
  ok("Proxy: auth + premium sem bypass óbvio");
} else {
  fail("Proxy: middleware incompleto");
}

// --- 8. Smoke mobile E2E ---
if (existsSync("e2e/responsive.spec.ts")) {
  const responsive = read("e2e/responsive.spec.ts");
  if (responsive.includes("390") && responsive.includes("844")) {
    ok("E2E responsivo: mobile 390×844 definido");
  } else {
    fail("E2E responsivo: viewport mobile ausente");
  }
} else {
  fail("E2E responsivo: falta e2e/responsive.spec.ts");
}

// --- 9. Privacidade / termos ---
const privacidade = read("src/app/privacidade/page.tsx");
const termos = read("src/app/termos/page.tsx");
for (const [label, content, needles] of [
  ["privacidade", privacidade, ["Stripe", "Gemini", "/contato"]],
  ["termos", termos, ["Stripe", "inteligência artificial", "/contato"]],
]) {
  const missing = needles.filter((n) => !content.includes(n));
  if (missing.length === 0) {
    ok(`Legal: /${label} menciona IA/Stripe/contato`);
  } else {
    fail(`Legal: /${label} falta ${missing.join(", ")}`);
  }
}

if (existsSync("src/app/contato/page.tsx")) {
  ok("Legal: /contato presente");
} else {
  fail("Legal: falta /contato");
}

// --- 10. Rollback documented ---
const deployChecklist = read("docs/deploy/DEPLOY-CHECKLIST.md");
if (deployChecklist.toLowerCase().includes("rollback")) {
  ok("Rollback: documentado em DEPLOY-CHECKLIST");
} else {
  fail("Rollback: falta seção em DEPLOY-CHECKLIST");
}

// --- Migrations referenced ---
for (const migration of [
  "supabase/migrations/20260618_teacher_teaching_context.sql",
  "supabase/migrations/20260618_teacher_correction_profile.sql",
]) {
  if (existsSync(migration)) {
    ok(`Migration: ${migration}`);
  } else {
    fail(`Migration: falta ${migration}`);
  }
}

console.log("");
if (failed > 0) {
  console.error(`verify:gate-launch FAILED (${failed} issue(s))`);
  process.exit(1);
}

console.log("verify:gate-launch: OK — revisar itens ⚠️ manual (billing, Stripe E2E, sign-off)");
process.exit(0);
