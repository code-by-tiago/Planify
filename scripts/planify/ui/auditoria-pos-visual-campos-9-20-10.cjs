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

function read(relativePath) {
  try {
    return fs.readFileSync(path.join(root, relativePath), "utf8");
  } catch {
    return "";
  }
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (["node_modules", ".next", ".git", ".vercel", "dist", "out"].includes(entry.name)) {
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
    });
  } catch (error) {
    return [
      error.stdout?.toString() || "",
      error.stderr?.toString() || "",
    ].join("\n");
  }
}

title("Arquivos principais");

const expectedFiles = [
  "src/app/page.tsx",
  "src/app/globals.css",
  "src/app/layout.tsx",
  "src/components/PlanifyBrandLogo.tsx",
  "src/components/PlanifyFieldEnhancer.tsx",
];

for (const file of expectedFiles) {
  if (exists(file)) ok(`${file} encontrado.`);
  else fail(`${file} não encontrado.`);
}

title("Home e identidade visual");

const home = read("src/app/page.tsx");
const globals = read("src/app/globals.css");

if (home.includes("Planeje, crie e edite aulas em minutos")) {
  ok("Home compacta permanece aplicada.");
} else {
  warn("Não encontrei o título da home compacta. Verifique se a home foi alterada depois.");
}

if (home.includes("/biblioteca") && home.includes("/marketplace")) {
  ok("Home contém links separados para Biblioteca e Marketplace.");
} else {
  fail("Home não contém links separados para Biblioteca e Marketplace.");
}

if (globals.includes("PLANIFY_LANDING_VIDEO_9_20_6_START")) {
  ok("Camada da landing premium 9.20.6 presente.");
} else {
  warn("Camada da landing 9.20.6 não encontrada. Pode estar tudo bem se foi consolidada manualmente.");
}

if (globals.includes("PLANIFY_COMPACT_HOME_9_20_7_START")) {
  ok("Camada de compactação 9.20.7 presente.");
} else {
  warn("Camada de compactação 9.20.7 não encontrada.");
}

if (globals.includes("PLANIFY_INTERNAL_REFINEMENT_9_20_8_START")) {
  ok("Camada de refinamento interno 9.20.8 presente.");
} else {
  warn("Camada de refinamento interno 9.20.8 não encontrada.");
}

if (globals.includes("PLANIFY_SMART_FIELDS_9_20_9_START")) {
  ok("CSS dos campos inteligentes 9.20.9 presente.");
} else {
  fail("CSS dos campos inteligentes 9.20.9 ausente.");
}

title("Campos inteligentes");

const enhancer = read("src/components/PlanifyFieldEnhancer.tsx");
const layout = read("src/app/layout.tsx");

if (layout.includes("PlanifyFieldEnhancer")) {
  ok("PlanifyFieldEnhancer está montado no layout.");
} else {
  fail("PlanifyFieldEnhancer não está montado no layout.");
}

for (const token of [
  "STAGE_INFANTIL",
  "STAGE_FUNDAMENTAL",
  "STAGE_MEDIO",
  "Linguagens e suas Tecnologias",
  "Matem\\u00e1tica",
  "getOptionsForKind",
  "openMenu",
  "KeyboardEvent",
]) {
  if (enhancer.includes(token)) {
    ok(`Token do enhancer encontrado: ${token}`);
  } else {
    warn(`Token do enhancer não encontrado: ${token}`);
  }
}

const forbiddenInCode = [
  "MatemÃ",
  "LÃ",
  "EducaÃ",
  "CiÃ",
  "HistÃ",
  "SÃ",
  "InformaÃ",
];

for (const bad of forbiddenInCode) {
  if (enhancer.includes(bad)) {
    fail(`Encoding corrompido encontrado em PlanifyFieldEnhancer: ${bad}`);
  } else {
    ok(`Sem encoding corrompido no enhancer: ${bad}`);
  }
}

title("Textos profissionais");

const appFiles = walk(path.join(root, "src", "app"))
  .filter((file) => /\.(tsx|ts|jsx|js)$/.test(file))
  .filter((file) => !file.includes(`${path.sep}api${path.sep}`));

const appText = appFiles.map((file) => fs.readFileSync(file, "utf8")).join("\n");

const badTexts = [
  "Checkout criado no servidor",
  "A chave secreta do Stripe",
  "cadastrados pelo administrador",
  "publicados pelo admin",
  "sem materiais fictícios",
];

for (const bad of badTexts) {
  if (appText.toLowerCase().includes(bad.toLowerCase())) {
    warn(`Texto pouco profissional/técnico ainda encontrado: ${bad}`);
  } else {
    ok(`Texto técnico/provisório ausente: ${bad}`);
  }
}

const mojibakePatterns = ["Ã§", "Ã£", "Ã©", "Ã¡", "Âº", "Âª", "â€”", "â€“"];
let mojibakeFindings = [];

for (const file of appFiles) {
  const rel = path.relative(root, file).replaceAll("\\", "/");
  const text = fs.readFileSync(file, "utf8");

  for (const pattern of mojibakePatterns) {
    if (text.includes(pattern)) {
      mojibakeFindings.push(`${rel}: ${pattern}`);
    }
  }
}

if (mojibakeFindings.length === 0) {
  ok("Nenhum mojibake comum encontrado em src/app.");
} else {
  warn(`Possíveis textos com encoding quebrado encontrados: ${mojibakeFindings.slice(0, 20).join(", ")}`);
}

title("Rotas principais");

const routes = [
  "src/app/planejamentos/page.tsx",
  "src/app/materiais/page.tsx",
  "src/app/editor/page.tsx",
  "src/app/biblioteca/page.tsx",
  "src/app/marketplace/page.tsx",
  "src/app/admin/page.tsx",
  "src/app/admin/biblioteca/page.tsx",
  "src/app/planos/page.tsx",
  "src/app/login/page.tsx",
  "src/app/contato/page.tsx",
];

for (const route of routes) {
  if (exists(route)) ok(`Rota existe: ${route}`);
  else warn(`Rota não encontrada diretamente: ${route}`);
}

title("Áreas sensíveis preservadas");

const sensitiveFiles = [
  "src/app/api/planejamentos/gerar/route.ts",
  "src/app/api/planejamentos/docx-pacote/route.ts",
  "src/app/api/stripe/checkout/route.ts",
  "src/app/api/stripe/webhook/route.ts",
  "src/app/api/biblioteca/materiais/route.ts",
  "src/app/api/marketplace/materiais/route.ts",
];

for (const file of sensitiveFiles) {
  if (exists(file)) ok(`Arquivo sensível preservado: ${file}`);
  else warn(`Arquivo sensível não encontrado no caminho esperado: ${file}`);
}

title("Git status");

const gitVersion = run("git --version").trim();
if (gitVersion) {
  ok(gitVersion);
  const status = run("git status --short").trim();
  if (status) {
    warn("Há arquivos modificados/novos aguardando commit.");
    report.push("```text");
    report.push(status.slice(0, 5000));
    report.push("```");
  } else {
    ok("Git status limpo.");
  }
} else {
  warn("Git não encontrado no PATH ou repositório ainda não inicializado.");
}

title("Checklist manual recomendado");

report.push("- Abrir `/` e confirmar Home compacta.");
report.push("- Abrir `/planos` e confirmar ausência de texto técnico.");
report.push("- Abrir `/planejamentos` e clicar em Etapa, Ano/Série, Área e Componente.");
report.push("- Abrir `/materiais` e clicar em Etapa, Ano/Série, Componente e Tipo de material.");
report.push("- Abrir `/biblioteca` e confirmar texto profissional e materiais reais.");
report.push("- Abrir `/marketplace` e confirmar página própria.");
report.push("- Gerar um planejamento simples e baixar DOCX.");
report.push("- Abrir o documento no Editor e confirmar edição.");
report.push("- Testar login admin e usuário premium.");

const outDir = path.join(root, "docs", "auditorias");
fs.mkdirSync(outDir, { recursive: true });

const file = path.join(
  outDir,
  `auditoria-pos-visual-campos-9-20-10-${new Date().toISOString().replace(/[:.]/g, "-")}.md`,
);

const header = [
  "# Planify — Auditoria 9.20.10 — Pós-visual e campos inteligentes",
  "",
  `Data: ${new Date().toLocaleString("pt-BR")}`,
  "",
  failures > 0
    ? `[ERRO] ${failures} falha(s). Corrigir antes de GitHub/deploy.`
    : warnings > 0
      ? `[AVISO] Sem falhas críticas, mas com ${warnings} aviso(s) para revisar.`
      : "[OK] Projeto está estável para seguir.",
  "",
];

fs.writeFileSync(file, `${[...header, ...report].join("\n")}\n`, "utf8");

console.log("");
console.log("===============================================");
console.log("Planify | Auditoria 9.20.10");
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
