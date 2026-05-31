const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const globalsPath = path.join(root, "src", "app", "globals.css");

const cleanStart = "/* PLANIFY_CLEAN_SAAS_9_20_5_START */";
const cleanEnd = "/* PLANIFY_CLEAN_SAAS_9_20_5_END */";

const oldBlocks = [
  {
    start: "/* PLANIFY_LIGHT_THEME_9_20_3_START */",
    end: "/* PLANIFY_LIGHT_THEME_9_20_3_END */",
  },
  {
    start: "/* PLANIFY_BRAND_THEME_9_20_4_START */",
    end: "/* PLANIFY_BRAND_THEME_9_20_4_END */",
  },
  {
    start: cleanStart,
    end: cleanEnd,
  },
];

const css = `${cleanStart}

/*
  Planify 9.20.5 — Interface clean inspirada em SaaS educacional

  Direção visual:
  - clara, limpa, educacional e profissional
  - inspirada em padrões de SaaS moderno para professores
  - sem copiar identidade, layout ou marca de terceiros
  - sem alterar lógica, APIs, banco, DOCX, Stripe, Admin, Biblioteca,
    Marketplace, Editor funcional ou Premium Gate
*/

:root {
  --planify-page: #fbfcff;
  --planify-page-soft: #f6f8ff;
  --planify-page-warm: #fffdf8;
  --planify-card: rgba(255, 255, 255, 0.96);
  --planify-card-solid: #ffffff;
  --planify-card-muted: #f8fafc;
  --planify-border: rgba(30, 41, 59, 0.10);
  --planify-border-blue: rgba(37, 99, 235, 0.16);
  --planify-text: #111827;
  --planify-text-soft: #334155;
  --planify-muted: #64748b;
  --planify-muted-2: #94a3b8;
  --planify-primary: #4f46e5;
  --planify-primary-2: #2563eb;
  --planify-cyan: #0891b2;
  --planify-cyan-soft: #ecfeff;
  --planify-purple-soft: #f3e8ff;
  --planify-blue-soft: #eff6ff;
  --planify-green: #047857;
  --planify-amber: #92400e;
  --planify-rose: #be123c;
  --planify-shadow-card: 0 18px 50px rgba(15, 23, 42, 0.08);
  --planify-shadow-soft: 0 10px 28px rgba(15, 23, 42, 0.06);
  --planify-radius-xl: 24px;
}

/* Base clara */
html,
body {
  background:
    radial-gradient(circle at top left, rgba(124, 58, 237, 0.10), transparent 30rem),
    radial-gradient(circle at top right, rgba(8, 145, 178, 0.12), transparent 32rem),
    linear-gradient(180deg, var(--planify-page) 0%, var(--planify-page-soft) 48%, #ffffff 100%) !important;
  color: var(--planify-text) !important;
}

/* Remove sensação de painel escuro */
body [class*="bg-slate-950"],
body [class*="bg-slate-900"],
body [class*="bg-slate-800"],
body [class*="bg-black"] {
  background-color: var(--planify-card) !important;
  color: var(--planify-text) !important;
}

/* Cabeçalho limpo */
body header {
  background: rgba(255, 255, 255, 0.92) !important;
  color: var(--planify-text) !important;
  border-color: var(--planify-border) !important;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04) !important;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

body header nav,
body header [class*="rounded-full"],
body header [class*="rounded-2xl"] {
  background: rgba(255, 255, 255, 0.82) !important;
  border-color: var(--planify-border) !important;
  box-shadow: none !important;
}

/* Cards e blocos */
body [class*="rounded-"][class*="border"] {
  border-color: var(--planify-border) !important;
}

body [class*="shadow-2xl"],
body [class*="shadow-xl"],
body [class*="shadow-lg"] {
  box-shadow: var(--planify-shadow-card) !important;
}

body [class*="bg-white/"],
body [class*="bg-white\\["] {
  background-color: var(--planify-card) !important;
}

/* Cores de cards de status, sem neon */
body [class*="bg-cyan-300/"],
body [class*="bg-sky-300/"],
body [class*="bg-blue-300/"] {
  background: linear-gradient(135deg, #eff6ff, #ecfeff) !important;
  border-color: rgba(8, 145, 178, 0.16) !important;
}

body [class*="bg-emerald-300/"] {
  background-color: #ecfdf5 !important;
  border-color: rgba(4, 120, 87, 0.16) !important;
}

body [class*="bg-amber-300/"] {
  background-color: #fffbeb !important;
  border-color: rgba(146, 64, 14, 0.16) !important;
}

body [class*="bg-rose-300/"] {
  background-color: #fff1f2 !important;
  border-color: rgba(190, 18, 60, 0.16) !important;
}

/* Tipografia */
body [class*="text-white"] {
  color: var(--planify-text) !important;
}

body [class*="text-slate-100"],
body [class*="text-slate-200"],
body [class*="text-slate-300"] {
  color: var(--planify-text-soft) !important;
}

body [class*="text-slate-400"],
body [class*="text-slate-500"],
body [class*="text-gray-400"],
body [class*="text-gray-500"] {
  color: var(--planify-muted) !important;
}

body [class*="text-cyan-100"],
body [class*="text-cyan-200"],
body [class*="text-cyan-300"],
body [class*="text-sky-100"],
body [class*="text-sky-200"],
body [class*="text-sky-300"] {
  color: var(--planify-cyan) !important;
}

body [class*="text-emerald-100"],
body [class*="text-emerald-200"],
body [class*="text-emerald-300"] {
  color: var(--planify-green) !important;
}

body [class*="text-amber-100"],
body [class*="text-amber-200"],
body [class*="text-amber-300"] {
  color: var(--planify-amber) !important;
}

body [class*="text-rose-100"],
body [class*="text-rose-200"],
body [class*="text-rose-300"] {
  color: var(--planify-rose) !important;
}

/* Botões mais Teachy-like: claros, arredondados, sem peso excessivo */
body button,
body a {
  text-decoration-thickness: 1px;
  text-underline-offset: 4px;
}

body button[class*="bg-white"],
body a[class*="bg-white"] {
  background: #ffffff !important;
  color: var(--planify-text) !important;
  border: 1px solid var(--planify-border) !important;
  box-shadow: var(--planify-shadow-soft) !important;
}

body button[class*="bg-white"]:hover,
body a[class*="bg-white"]:hover {
  background: #f8fafc !important;
  border-color: var(--planify-border-blue) !important;
  transform: translateY(-1px);
}

/* Botões/pills com destaque principal */
body [class*="bg-cyan-300/"] button,
body [class*="bg-blue-300/"] button,
body [class*="bg-sky-300/"] button {
  border-color: rgba(37, 99, 235, 0.14) !important;
}

/* Inputs */
body input,
body textarea,
body select {
  color: var(--planify-text) !important;
  background-color: #ffffff !important;
  border-color: var(--planify-border) !important;
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.03) !important;
}

body input::placeholder,
body textarea::placeholder {
  color: var(--planify-muted-2) !important;
}

body option {
  background-color: #ffffff !important;
  color: var(--planify-text) !important;
}

/* Logo discreto */
.planify-brand-logo {
  color: var(--planify-text);
  min-width: fit-content;
}

.planify-brand-logo__icon {
  width: 46px;
  height: 46px;
  border-radius: 16px;
  flex: 0 0 auto;
}

.planify-brand-logo__text {
  display: flex;
  flex-direction: column;
  line-height: 1.05;
}

.planify-brand-logo__name {
  color: var(--planify-text);
  font-size: 1.34rem;
  font-weight: 900;
  letter-spacing: -0.045em;
}

.planify-brand-logo__tagline {
  margin-top: 0.26rem;
  color: var(--planify-muted);
  font-size: 0.78rem;
  font-weight: 650;
  letter-spacing: -0.01em;
}

/* Ícone P antigo, caso o cabeçalho ainda use o antigo */
body header a[href="/"] > div:first-child,
body header a[href="/"] [class*="from-cyan-300"][class*="to-violet-500"] {
  background: linear-gradient(135deg, #7c3aed, #2563eb, #06b6d4) !important;
  color: #ffffff !important;
  box-shadow: 0 12px 26px rgba(37, 99, 235, 0.16) !important;
}

/* Hero e grandes títulos: mais limpos */
body h1,
body h2,
body h3 {
  letter-spacing: -0.04em;
}

body p {
  color: inherit;
}

/* Editor: preserva folha branca e contraste */
body .planify-editor-page {
  background-color: #ffffff !important;
  color: #0f172a !important;
  box-shadow: 0 26px 70px rgba(15, 23, 42, 0.14) !important;
}

body .planify-editor-page * {
  color: inherit;
}

/* Tabelas */
body table {
  background-color: #ffffff;
}

body td,
body th {
  border-color: rgba(100, 116, 139, 0.30) !important;
}

/* Foco e seleção */
body ::selection {
  background: rgba(37, 99, 235, 0.18);
}

body :focus-visible {
  outline: 3px solid rgba(37, 99, 235, 0.22);
  outline-offset: 2px;
}

/* Menos poluição visual em botões/cards ao passar o mouse */
body [class*="rounded-"][class*="border"] {
  transition:
    background-color 160ms ease,
    border-color 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;
}

body [class*="rounded-"][class*="border"]:hover {
  border-color: rgba(37, 99, 235, 0.18) !important;
}

/* Impressão limpa */
@media print {
  body {
    background: #ffffff !important;
  }
}

${cleanEnd}
`;

function backup(file) {
  if (!fs.existsSync(file)) return;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  fs.copyFileSync(file, `${file}.bak-9-20-5-${stamp}`);
}

function removeBlock(content, start, end) {
  const regex = new RegExp(`\\n?${start.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${end.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\n?`, "m");
  return content.replace(regex, "\n");
}

function ensureGlobalsCss() {
  if (!fs.existsSync(globalsPath)) {
    console.error("ERRO: src/app/globals.css não encontrado.");
    process.exit(1);
  }

  backup(globalsPath);

  let content = fs.readFileSync(globalsPath, "utf8");

  for (const block of oldBlocks) {
    content = removeBlock(content, block.start, block.end);
  }

  content = `${content.trimEnd()}\n\n${css}\n`;
  fs.writeFileSync(globalsPath, content, "utf8");

  console.log("[OK] globals.css atualizado com interface clean 9.20.5.");
  console.log("[OK] Blocos 9.20.3 e 9.20.4 foram removidos se existiam.");
}

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (["node_modules", ".next", ".git", ".vercel"].includes(entry.name)) continue;
      walk(full, files);
    } else {
      files.push(full);
    }
  }

  return files;
}

function tryPatchHeaderLogo() {
  const componentPath = path.join(root, "src", "components", "PlanifyBrandLogo.tsx");

  if (!fs.existsSync(componentPath)) {
    console.log("[AVISO] PlanifyBrandLogo.tsx não encontrado. CSS ainda estiliza o logo existente.");
    return;
  }

  const candidates = [
    path.join(root, "src", "components", "PageShell.tsx"),
    path.join(root, "src", "components", "Header.tsx"),
    path.join(root, "src", "components", "Navbar.tsx"),
    path.join(root, "src", "app", "layout.tsx"),
    ...walk(path.join(root, "src", "components")).filter((file) => file.endsWith(".tsx")),
  ];

  const unique = [...new Set(candidates)].filter(fs.existsSync);

  for (const file of unique) {
    let content = fs.readFileSync(file, "utf8");

    if (content.includes("PlanifyBrandLogo")) {
      console.log(`[OK] Cabeçalho já usa PlanifyBrandLogo em ${path.relative(root, file)}.`);
      return;
    }

    if (!content.includes("Planify") || !content.includes("SaaS educacional premium")) {
      continue;
    }

    const linkRegex = /(<(?:Link|a)\b[^>]*(?:href=["']\/["']|href=\{["']\/["']\})[^>]*>)([\s\S]{0,1600}?Planify[\s\S]{0,800}?SaaS educacional premium[\s\S]{0,500}?)(<\/(?:Link|a)>)/m;

    if (!linkRegex.test(content)) {
      continue;
    }

    backup(file);

    const importPath = path
      .relative(path.dirname(file), componentPath.replace(/\.tsx$/, ""))
      .replaceAll("\\", "/");
    const normalizedImportPath = importPath.startsWith(".") ? importPath : `./${importPath}`;
    const importLine = `import { PlanifyBrandLogo } from "${normalizedImportPath}";\n`;

    const firstImport = content.match(/^import .*?;\n/m);

    if (firstImport) {
      content = content.replace(firstImport[0], `${firstImport[0]}${importLine}`);
    } else {
      content = `${importLine}${content}`;
    }

    content = content.replace(linkRegex, `$1<PlanifyBrandLogo />$3`);
    fs.writeFileSync(file, content, "utf8");
    console.log(`[OK] Logo limpo aplicado em ${path.relative(root, file)}.`);
    return;
  }

  console.log("[AVISO] Não encontrei cabeçalho seguro para trocar automaticamente. CSS estilizará o logo existente.");
}

ensureGlobalsCss();
tryPatchHeaderLogo();

console.log("");
console.log("Interface clean 9.20.5 aplicada sem mexer nas funcionalidades.");
