const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const globalsPath = path.join(root, "src", "app", "globals.css");

const start = "/* PLANIFY_BRAND_THEME_9_20_4_START */";
const end = "/* PLANIFY_BRAND_THEME_9_20_4_END */";

const css = `${start}

/*
  Planify 9.20.4 — Identidade visual premium

  Inspirado em um padrão SaaS educacional claro, moderno e amigável.
  Não altera lógica, rotas, APIs, DOCX, Stripe, Admin, Biblioteca, Marketplace ou Editor funcional.
*/

:root {
  --planify-bg: #f6fbff;
  --planify-bg-soft: #eef8ff;
  --planify-bg-lavender: #f4f0ff;
  --planify-card: rgba(255, 255, 255, 0.92);
  --planify-card-strong: #ffffff;
  --planify-card-soft: rgba(248, 250, 252, 0.94);
  --planify-line: rgba(37, 99, 235, 0.14);
  --planify-line-strong: rgba(6, 182, 212, 0.26);
  --planify-ink: #0f172a;
  --planify-ink-soft: #334155;
  --planify-muted: #64748b;
  --planify-blue: #2563eb;
  --planify-sky: #0284c7;
  --planify-cyan: #06b6d4;
  --planify-teal: #14b8a6;
  --planify-lavender: #a78bfa;
  --planify-green: #047857;
  --planify-amber: #92400e;
  --planify-rose: #be123c;
  --planify-shadow-sm: 0 10px 32px rgba(15, 23, 42, 0.08);
  --planify-shadow: 0 24px 90px rgba(15, 23, 42, 0.12);
  --planify-glow: 0 0 0 1px rgba(6, 182, 212, 0.08), 0 22px 80px rgba(6, 182, 212, 0.14);
}

html,
body {
  background:
    radial-gradient(circle at 8% 0%, rgba(6, 182, 212, 0.18), transparent 30rem),
    radial-gradient(circle at 92% 10%, rgba(167, 139, 250, 0.14), transparent 28rem),
    linear-gradient(180deg, var(--planify-bg) 0%, var(--planify-bg-soft) 45%, #ffffff 100%) !important;
  color: var(--planify-ink) !important;
}

/* Textura leve premium */
body::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -1;
  background-image:
    linear-gradient(rgba(37, 99, 235, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(37, 99, 235, 0.035) 1px, transparent 1px);
  background-size: 34px 34px;
  mask-image: linear-gradient(to bottom, rgba(0,0,0,0.6), transparent 70%);
}

/* Header e navegação */
body header {
  background: rgba(255, 255, 255, 0.86) !important;
  color: var(--planify-ink) !important;
  border-color: var(--planify-line) !important;
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
}

body header nav,
body header [class*="rounded-full"],
body header [class*="rounded-2xl"] {
  background-color: rgba(255, 255, 255, 0.72) !important;
  border-color: var(--planify-line) !important;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
}

/* Superfícies antes muito escuras */
body [class*="bg-slate-950"],
body [class*="bg-slate-900"],
body [class*="bg-slate-800"],
body [class*="bg-black"] {
  background-color: var(--planify-card-soft) !important;
  color: var(--planify-ink) !important;
}

/* Cards translúcidos */
body [class*="bg-white/"],
body [class*="bg-white\\["] {
  background-color: var(--planify-card) !important;
}

body [class*="bg-cyan-300/"],
body [class*="bg-sky-300/"],
body [class*="bg-blue-300/"] {
  background: linear-gradient(135deg, rgba(224, 247, 255, 0.94), rgba(239, 246, 255, 0.90)) !important;
}

body [class*="bg-emerald-300/"] {
  background-color: rgba(220, 252, 231, 0.90) !important;
}

body [class*="bg-amber-300/"] {
  background-color: rgba(254, 243, 199, 0.90) !important;
}

body [class*="bg-rose-300/"] {
  background-color: rgba(255, 228, 230, 0.90) !important;
}

/* Bordas e sombras */
body [class*="border-white/"],
body [class*="border-slate-"],
body [class*="border-cyan-300/"],
body [class*="border-sky-300/"],
body [class*="border-blue-300/"] {
  border-color: var(--planify-line) !important;
}

body [class*="shadow-2xl"],
body [class*="shadow-xl"] {
  box-shadow: var(--planify-shadow) !important;
}

body [class*="shadow-cyan"],
body [class*="shadow-blue"] {
  box-shadow: var(--planify-glow) !important;
}

/* Texto */
body [class*="text-white"] {
  color: var(--planify-ink) !important;
}

body [class*="text-slate-100"],
body [class*="text-slate-200"],
body [class*="text-slate-300"] {
  color: var(--planify-ink-soft) !important;
}

body [class*="text-slate-400"],
body [class*="text-slate-500"] {
  color: var(--planify-muted) !important;
}

body [class*="text-cyan-100"],
body [class*="text-cyan-200"],
body [class*="text-cyan-300"] {
  color: var(--planify-sky) !important;
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

/* Botões */
body button,
body a {
  text-decoration-color: rgba(2, 132, 199, 0.45);
}

body button[class*="bg-white"],
body a[class*="bg-white"] {
  background: linear-gradient(135deg, #ffffff, #e0f7ff) !important;
  color: var(--planify-ink) !important;
  border-color: rgba(6, 182, 212, 0.18) !important;
  box-shadow: 0 12px 28px rgba(6, 182, 212, 0.14);
}

body button[class*="bg-white"]:hover,
body a[class*="bg-white"]:hover {
  background: linear-gradient(135deg, #ecfeff, #dbeafe) !important;
  transform: translateY(-1px);
}

/* Inputs */
body input,
body textarea,
body select {
  color: var(--planify-ink) !important;
  background-color: rgba(255, 255, 255, 0.94) !important;
  border-color: var(--planify-line) !important;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.65);
}

body input::placeholder,
body textarea::placeholder {
  color: #94a3b8 !important;
}

body option {
  color: var(--planify-ink) !important;
  background-color: #ffffff !important;
}

/* Logo Planify */
.planify-brand-logo {
  color: var(--planify-ink);
  min-width: fit-content;
}

.planify-brand-logo__icon {
  width: 52px;
  height: 52px;
  border-radius: 18px;
  flex: 0 0 auto;
}

.planify-brand-logo__text {
  display: flex;
  flex-direction: column;
  line-height: 1.05;
}

.planify-brand-logo__name {
  color: var(--planify-ink);
  font-size: 1.42rem;
  font-weight: 950;
  letter-spacing: -0.04em;
}

.planify-brand-logo__tagline {
  margin-top: 0.28rem;
  color: var(--planify-muted);
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

/* Caso o cabeçalho antigo continue aparecendo, melhora o ícone P antigo */
body header a[href="/"] > div:first-child,
body header a[href="/"] [class*="from-cyan-300"][class*="to-violet-500"] {
  background: linear-gradient(135deg, var(--planify-blue), var(--planify-cyan), var(--planify-teal)) !important;
  color: #ffffff !important;
  box-shadow: 0 16px 36px rgba(6, 182, 212, 0.22) !important;
}

/* Editor: manter folha branca e legível */
body .planify-editor-page {
  background-color: #ffffff !important;
  color: #0f172a !important;
  box-shadow: 0 28px 80px rgba(15, 23, 42, 0.18) !important;
}

body .planify-editor-page * {
  color: inherit;
}

/* Tabelas */
body table {
  background-color: rgba(255, 255, 255, 0.96);
}

body td,
body th {
  border-color: rgba(100, 116, 139, 0.32) !important;
}

/* Microinterações */
body [class*="rounded-"][class*="border"] {
  transition:
    background-color 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease,
    transform 180ms ease;
}

body [class*="rounded-"][class*="border"]:hover {
  border-color: rgba(6, 182, 212, 0.28) !important;
}

/* Seleção e foco */
body ::selection {
  background: rgba(6, 182, 212, 0.24);
}

body :focus-visible {
  outline: 3px solid rgba(6, 182, 212, 0.34);
  outline-offset: 2px;
}

/* Impressão limpa */
@media print {
  body {
    background: #ffffff !important;
  }

  body::before {
    display: none !important;
  }
}

${end}
`;

function backup(file) {
  if (!fs.existsSync(file)) {
    return;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  fs.copyFileSync(file, `${file}.bak-9-20-4-${timestamp}`);
}

function ensureGlobalsCss() {
  if (!fs.existsSync(globalsPath)) {
    console.error("ERRO: src/app/globals.css não encontrado.");
    process.exit(1);
  }

  backup(globalsPath);

  let content = fs.readFileSync(globalsPath, "utf8");
  const regex = new RegExp(`${start}[\\s\\S]*?${end}\\n?`, "m");

  if (regex.test(content)) {
    content = content.replace(regex, `${css}\n`);
    console.log("[OK] Bloco visual 9.20.4 atualizado em globals.css.");
  } else {
    content = `${content.trimEnd()}\n\n${css}\n`;
    console.log("[OK] Bloco visual 9.20.4 adicionado em globals.css.");
  }

  fs.writeFileSync(globalsPath, content, "utf8");
}

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) {
    return files;
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (["node_modules", ".next", ".git", ".vercel"].includes(entry.name)) {
        continue;
      }

      walk(full, files);
    } else {
      files.push(full);
    }
  }

  return files;
}

function tryPatchPageShellLogo() {
  const candidateFiles = [
    path.join(root, "src", "components", "PageShell.tsx"),
    path.join(root, "src", "components", "Header.tsx"),
    path.join(root, "src", "components", "Navbar.tsx"),
    path.join(root, "src", "app", "layout.tsx"),
  ].filter(fs.existsSync);

  const extraFiles = walk(path.join(root, "src", "components"))
    .filter((file) => file.endsWith(".tsx") || file.endsWith(".ts"))
    .filter((file) => !candidateFiles.includes(file));

  const files = [...candidateFiles, ...extraFiles];
  let patched = false;

  for (const file of files) {
    let content = fs.readFileSync(file, "utf8");

    if (content.includes("PlanifyBrandLogo")) {
      console.log(`[OK] Logo Planify já aplicado em ${path.relative(root, file)}.`);
      patched = true;
      continue;
    }

    if (!content.includes("SaaS educacional premium") || !content.includes("Planify")) {
      continue;
    }

    const importPath =
      path.relative(path.dirname(file), path.join(root, "src", "components", "PlanifyBrandLogo"))
        .replaceAll("\\", "/")
        .replace(/^([^\.])/, "./$1");

    const normalizedImportPath = importPath.startsWith(".") ? importPath : `./${importPath}`;

    const linkRegex = /(<(?:Link|a)\b[^>]*(?:href=["']\/["']|href=\{["']\/["']\})[^>]*>)([\s\S]{0,1400}?SaaS educacional premium[\s\S]{0,500}?)(<\/(?:Link|a)>)/m;

    if (!linkRegex.test(content)) {
      continue;
    }

    backup(file);

    if (!content.includes("from")) {
      // nothing
    }

    const importLine = `import { PlanifyBrandLogo } from "${normalizedImportPath}";\n`;

    if (!content.includes('PlanifyBrandLogo"') && !content.includes("PlanifyBrandLogo'")) {
      const firstImport = content.match(/^import .*?;\n/m);

      if (firstImport) {
        content = content.replace(firstImport[0], `${firstImport[0]}${importLine}`);
      } else {
        content = `${importLine}${content}`;
      }
    }

    content = content.replace(
      linkRegex,
      `$1<PlanifyBrandLogo />$3`,
    );

    fs.writeFileSync(file, content, "utf8");
    console.log(`[OK] Cabeçalho atualizado com PlanifyBrandLogo em ${path.relative(root, file)}.`);
    patched = true;
    break;
  }

  if (!patched) {
    console.log("[AVISO] Não encontrei um cabeçalho seguro para substituir automaticamente. O CSS ainda estiliza o logo existente e o componente foi criado.");
  }
}

ensureGlobalsCss();
tryPatchPageShellLogo();

console.log("");
console.log("Identidade visual Planify 9.20.4 aplicada.");
