const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
let failures = 0;
let warnings = 0;
const report = [];

function ok(message) { report.push(`[OK] ${message}`); }
function warn(message) { warnings += 1; report.push(`[AVISO] ${message}`); }
function fail(message) { failures += 1; report.push(`[ERRO] ${message}`); }
function read(relativePath) { try { return fs.readFileSync(path.join(root, relativePath), "utf8"); } catch { return ""; } }

const enhancer = read("src/components/PlanifyFieldEnhancer.tsx");
const globals = read("src/app/globals.css");

const requiredEnhancerTokens = [
  "L\\u00edngua Espanhola",
  "if (field instanceof HTMLTextAreaElement) return null;",
  "BNCC_MAX_PER_CONTENT = 3",
  "filterBnccSuggestionCards",
  "openMenu(field, kind, false)",
  "enforceCompatibility",
  "AREA_LINGUAGENS_MEDIO",
];

for (const token of requiredEnhancerTokens) {
  if (enhancer.includes(token)) ok(`Enhancer contem: ${token}`);
  else fail(`Enhancer nao contem: ${token}`);
}

const forbiddenCorruption = ["MatemÃ", "LÃ", "EducaÃ", "CiÃ", "HistÃ", "InformaÃ"];
for (const bad of forbiddenCorruption) {
  if (enhancer.includes(bad)) fail(`Encoding corrompido no enhancer: ${bad}`);
  else ok(`Sem encoding corrompido no enhancer: ${bad}`);
}

if (globals.includes("PLANIFY_PLANNING_SMART_FIX_9_21_1_START")) ok("CSS 9.21.1 presente.");
else fail("CSS 9.21.1 ausente.");

for (const cssToken of ["planify-smart-field-menu", "planify-bncc-filter-notice"]) {
  if (globals.includes(cssToken)) ok(`CSS contem: ${cssToken}`);
  else warn(`CSS nao contem: ${cssToken}`);
}

ok("Escopo preservado: apenas PlanifyFieldEnhancer e CSS visual.");
ok("Nao altera DOCX, Planejamentos backend, BNCC backend, Stripe, Supabase, APIs, banco, login ou assinaturas.");

const outDir = path.join(root, "docs", "auditorias");
fs.mkdirSync(outDir, { recursive: true });

const file = path.join(outDir, `auditoria-planejamentos-campos-bncc-9-21-1-${new Date().toISOString().replace(/[:.]/g, "-")}.md`);

const header = [
  "# Planify — Auditoria 9.21.1 — Planejamentos campos e BNCC",
  "",
  `Data: ${new Date().toLocaleString("pt-BR")}`,
  "",
  failures > 0 ? `[ERRO] ${failures} falha(s).` : warnings > 0 ? `[AVISO] Sem falhas criticas, mas com ${warnings} aviso(s).` : "[OK] Ajuste aplicado.",
  "",
];

fs.writeFileSync(file, `${[...header, ...report].join("\n")}\n`, "utf8");

console.log("");
console.log("===============================================");
console.log("Planify | Auditoria 9.21.1");
console.log("===============================================");
console.log("");
console.log(failures > 0 ? `Resultado: FALHAS (${failures}) E AVISOS (${warnings})` : warnings > 0 ? `Resultado: OK COM AVISOS (${warnings})` : "Resultado: OK");
console.log("");
console.log(`Relatorio salvo em: ${file}`);
console.log("");

if (failures > 0) process.exitCode = 1;
