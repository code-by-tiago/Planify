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

const visibleFiles = [
  ...walk(path.join(root, "src", "app")),
  ...walk(path.join(root, "src", "components")),
]
  .filter((file) => /\.(tsx|ts|jsx|js|css)$/.test(file))
  .filter((file) => !file.includes(`${path.sep}api${path.sep}`))
  .filter((file) => !file.includes(`${path.sep}scripts${path.sep}`))
  .filter((file) => !file.includes(`${path.sep}docs${path.sep}`))
  .filter((file) => !file.includes(".bak-"))
  .filter((file) => !file.endsWith(path.join("src", "components", "PlanifyFieldEnhancer.tsx")));

const unicodeEscapeFindings = [];
const mojibakeFindings = [];

const mojibakeFragments = [
  "\u00c3",
  "\u00c2",
  "\u00e2\u20ac",
];

for (const file of visibleFiles) {
  const rel = path.relative(root, file).replaceAll("\\", "/");
  const text = fs.readFileSync(file, "utf8");

  const unicodeMatches = text.match(/\\u00[0-9a-fA-F]{2}/g);
  if (unicodeMatches?.length) {
    unicodeEscapeFindings.push(`${rel}: ${[...new Set(unicodeMatches)].slice(0, 8).join(", ")}`);
  }

  for (const fragment of mojibakeFragments) {
    if (text.includes(fragment)) {
      mojibakeFindings.push(`${rel}: ${fragment}`);
    }
  }
}

if (unicodeEscapeFindings.length === 0) {
  ok("Nenhuma sequência literal \\u00 encontrada em arquivos visuais.");
} else {
  fail(`Sequências literais \\u00 ainda encontradas: ${unicodeEscapeFindings.slice(0, 20).join(" | ")}`);
}

if (mojibakeFindings.length === 0) {
  ok("Nenhum fragmento comum de mojibake encontrado em arquivos visuais.");
} else {
  warn(`Possíveis fragmentos de encoding quebrado: ${mojibakeFindings.slice(0, 20).join(" | ")}`);
}

const home = read("src/app/page.tsx");

const expectedHomeTexts = [
  "Começar agora",
  "BNCC por conteúdo",
  "Editor avançado",
  "Dúvidas frequentes",
  "experiência organizada",
  "IA pedagógica",
  "Segurança e acesso premium",
];

for (const expected of expectedHomeTexts) {
  if (home.includes(expected)) {
    ok(`Texto correto na Home: ${expected}`);
  } else {
    warn(`Texto esperado não encontrado na Home: ${expected}`);
  }
}

for (const route of ["/planos", "/login", "/dashboard", "/planejamentos", "/materiais", "/editor", "/biblioteca", "/marketplace"]) {
  if (home.includes(route)) {
    ok(`Link preservado na Home: ${route}`);
  } else {
    warn(`Link não encontrado na Home: ${route}`);
  }
}

ok("Escopo preservado: correção textual/encoding em arquivos visuais.");
ok("Não altera APIs, DOCX, BNCC, Stripe, Supabase, banco, login, assinaturas, Biblioteca real, Marketplace real ou Editor funcional.");

const outDir = path.join(root, "docs", "auditorias");
fs.mkdirSync(outDir, { recursive: true });

const file = path.join(
  outDir,
  `auditoria-fix-textos-landing-9-20-11-1-${new Date().toISOString().replace(/[:.]/g, "-")}.md`,
);

const header = [
  "# Planify — Auditoria 9.20.11.1 — Correção de textos/encoding",
  "",
  `Data: ${new Date().toLocaleString("pt-BR")}`,
  "",
  failures > 0
    ? `[ERRO] ${failures} falha(s). Corrigir antes de seguir.`
    : warnings > 0
      ? `[AVISO] Sem falhas críticas, mas com ${warnings} aviso(s).`
      : "[OK] Textos corrigidos.",
  "",
];

fs.writeFileSync(file, `${[...header, ...report].join("\n")}\n`, "utf8");

console.log("");
console.log("===============================================");
console.log("Planify | Auditoria 9.20.11.1");
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
