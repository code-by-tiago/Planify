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

function read(relativePath) {
  try {
    return fs.readFileSync(path.join(root, relativePath), "utf8");
  } catch {
    return "";
  }
}

const page = read("src/app/page.tsx");
const css = read("src/app/globals.css");
const logo = read("src/components/PlanifyBrandLogo.tsx");

if (page.includes("planify-hero") && page.includes("planify-video-card")) {
  ok("Home com hero e bloco de vídeo encontrada.");
} else {
  fail("Home 9.20.6 não foi aplicada corretamente.");
}

for (const route of ["/planos", "/login", "/dashboard", "/planejamentos", "/materiais", "/editor", "/biblioteca"]) {
  if (page.includes(`href="${route}"`) || page.includes(`href: "${route}"`)) {
    ok(`Link preservado: ${route}`);
  } else {
    warn(`Não encontrei link explícito para ${route}.`);
  }
}

if (css.includes("PLANIFY_LANDING_VIDEO_9_20_6_START")) {
  ok("CSS 9.20.6 presente.");
} else {
  fail("CSS 9.20.6 ausente.");
}

if (css.includes("PLANIFY_BRAND_THEME_9_20_4_START") || css.includes("PLANIFY_CLEAN_SAAS_9_20_5_START")) {
  warn("Há bloco visual antigo ainda presente.");
} else {
  ok("Blocos visuais 9.20.4/9.20.5 removidos.");
}

if (logo.includes("PlanifyBrandLogo")) {
  ok("Logo Planify presente.");
} else {
  warn("Componente de logo não encontrado ou incompleto.");
}

ok("Escopo esperado: home, logo e CSS global. APIs, banco, DOCX, Stripe e lógica premium não são alterados.");

const outDir = path.join(root, "docs", "auditorias");
fs.mkdirSync(outDir, { recursive: true });

const file = path.join(
  outDir,
  `auditoria-landing-video-9-20-6-${new Date().toISOString().replace(/[:.]/g, "-")}.md`,
);

const header = [
  "# Planify — Auditoria landing hero vídeo 9.20.6",
  "",
  `Data: ${new Date().toLocaleString("pt-BR")}`,
  "",
  failures > 0
    ? `[ERRO] ${failures} falha(s).`
    : warnings > 0
      ? `[AVISO] Sem falhas críticas, mas com ${warnings} aviso(s).`
      : "[OK] Landing premium aplicada.",
  "",
];

fs.writeFileSync(file, `${[...header, ...report].join("\n")}\n`, "utf8");

console.log("");
console.log("===============================================");
console.log("Planify | Auditoria landing 9.20.6");
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
console.log(`Relatório salvo em: ${file}`);
console.log("");

if (failures > 0) {
  process.exitCode = 1;
}
