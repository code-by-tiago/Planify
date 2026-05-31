const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const globalsPath = path.join(root, "src", "app", "globals.css");

if (!fs.existsSync(globalsPath)) {
  console.error("ERRO: src/app/globals.css não encontrado.");
  process.exit(1);
}

const start = "/* PLANIFY_LIGHT_THEME_9_20_3_START */";
const end = "/* PLANIFY_LIGHT_THEME_9_20_3_END */";

const lightThemeCss = `${start}

/*
  Planify 9.20.3 — Clareamento visual seguro

  Objetivo:
  - Clarear o visual do SaaS sem alterar lógica, rotas, APIs, DOCX, Stripe, Admin,
    Biblioteca, Marketplace, Editor ou Premium Gate.
  - Este bloco atua como camada visual final sobre classes Tailwind escuras já existentes.
*/

:root {
  --planify-page: #f4fbff;
  --planify-page-2: #eef7ff;
  --planify-surface: rgba(255, 255, 255, 0.92);
  --planify-surface-solid: #ffffff;
  --planify-surface-soft: rgba(248, 250, 252, 0.94);
  --planify-border: rgba(14, 116, 144, 0.16);
  --planify-border-strong: rgba(8, 145, 178, 0.24);
  --planify-text: #0f172a;
  --planify-text-soft: #334155;
  --planify-muted: #64748b;
  --planify-accent: #0284c7;
  --planify-accent-2: #06b6d4;
  --planify-success: #047857;
  --planify-warning: #92400e;
  --planify-danger: #be123c;
  --planify-shadow: 0 24px 80px rgba(15, 23, 42, 0.10);
}

html,
body {
  background:
    radial-gradient(circle at top left, rgba(34, 211, 238, 0.18), transparent 34rem),
    radial-gradient(circle at top right, rgba(124, 58, 237, 0.10), transparent 30rem),
    linear-gradient(180deg, var(--planify-page) 0%, var(--planify-page-2) 48%, #f8fafc 100%) !important;
  color: var(--planify-text) !important;
}

/* Fundos escuros recorrentes convertidos em superfícies claras */
body [class*="bg-slate-950"],
body [class*="bg-slate-900"],
body [class*="bg-slate-800"] {
  background-color: var(--planify-surface-soft) !important;
  color: var(--planify-text) !important;
}

body header[class*="bg-slate"],
body footer[class*="bg-slate"] {
  background-color: rgba(255, 255, 255, 0.88) !important;
  color: var(--planify-text) !important;
  backdrop-filter: blur(22px);
  -webkit-backdrop-filter: blur(22px);
}

body [class*="bg-white/"],
body [class*="bg-white\\["] {
  background-color: rgba(255, 255, 255, 0.78) !important;
}

body [class*="bg-cyan-300/"],
body [class*="bg-sky-300/"],
body [class*="bg-blue-300/"] {
  background-color: rgba(224, 247, 255, 0.82) !important;
}

body [class*="bg-emerald-300/"] {
  background-color: rgba(220, 252, 231, 0.84) !important;
}

body [class*="bg-amber-300/"] {
  background-color: rgba(254, 243, 199, 0.82) !important;
}

body [class*="bg-rose-300/"] {
  background-color: rgba(255, 228, 230, 0.82) !important;
}

/* Cards e painéis */
body [class*="rounded-"][class*="border"] {
  border-color: var(--planify-border) !important;
}

body [class*="shadow-2xl"],
body [class*="shadow-xl"] {
  box-shadow: var(--planify-shadow) !important;
}

/* Textos */
body [class*="text-white"] {
  color: var(--planify-text) !important;
}

body [class*="text-slate-100"],
body [class*="text-slate-200"],
body [class*="text-slate-300"] {
  color: var(--planify-text-soft) !important;
}

body [class*="text-slate-400"],
body [class*="text-slate-500"] {
  color: var(--planify-muted) !important;
}

body [class*="text-cyan-100"],
body [class*="text-cyan-200"],
body [class*="text-cyan-300"] {
  color: var(--planify-accent) !important;
}

body [class*="text-emerald-100"],
body [class*="text-emerald-200"],
body [class*="text-emerald-300"] {
  color: var(--planify-success) !important;
}

body [class*="text-amber-100"],
body [class*="text-amber-200"],
body [class*="text-amber-300"] {
  color: var(--planify-warning) !important;
}

body [class*="text-rose-100"],
body [class*="text-rose-200"],
body [class*="text-rose-300"] {
  color: var(--planify-danger) !important;
}

/* Bordas */
body [class*="border-white/"],
body [class*="border-slate-"] {
  border-color: var(--planify-border) !important;
}

body [class*="border-cyan-300/"],
body [class*="border-sky-300/"],
body [class*="border-blue-300/"] {
  border-color: var(--planify-border-strong) !important;
}

/* Formulários */
body input,
body textarea,
body select {
  color: var(--planify-text) !important;
  background-color: rgba(255, 255, 255, 0.92) !important;
  border-color: var(--planify-border) !important;
}

body input::placeholder,
body textarea::placeholder {
  color: #94a3b8 !important;
}

body option {
  color: var(--planify-text) !important;
  background-color: #ffffff !important;
}

/* Botões e links em áreas claras */
body a,
body button {
  text-decoration-color: rgba(2, 132, 199, 0.45);
}

body button[class*="bg-white"],
body a[class*="bg-white"] {
  background-color: #ffffff !important;
  color: #0f172a !important;
  border-color: rgba(2, 132, 199, 0.16) !important;
}

body button[class*="bg-white"]:hover,
body a[class*="bg-white"]:hover {
  background-color: #e0f2fe !important;
}

/* Destaques premium mais claros */
body [class*="from-cyan-300"][class*="to-violet-500"] {
  box-shadow: 0 16px 45px rgba(14, 165, 233, 0.20) !important;
}

/* Editor: mantém folha branca e ferramentas legíveis */
body .planify-editor-page {
  background-color: #ffffff !important;
  color: #0f172a !important;
  box-shadow: 0 28px 80px rgba(15, 23, 42, 0.18) !important;
}

body .planify-editor-page * {
  color: inherit;
}

/* Tabelas e documentos */
body table {
  background-color: rgba(255, 255, 255, 0.96);
}

body td,
body th {
  border-color: rgba(100, 116, 139, 0.32) !important;
}

/* Navegação: menos peso visual */
body header nav {
  background-color: rgba(255, 255, 255, 0.66) !important;
  border-color: var(--planify-border) !important;
}

/* Seleção e foco */
body ::selection {
  background: rgba(14, 165, 233, 0.22);
}

body :focus-visible {
  outline: 3px solid rgba(14, 165, 233, 0.32);
  outline-offset: 2px;
}

/* Mantém mensagens de alerta visíveis em tema claro */
body [class*="bg-amber-300/"] [class*="text-amber"],
body [class*="bg-rose-300/"] [class*="text-rose"],
body [class*="bg-emerald-300/"] [class*="text-emerald"],
body [class*="bg-cyan-300/"] [class*="text-cyan"] {
  font-weight: 700;
}

${end}
`;

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
fs.copyFileSync(globalsPath, `${globalsPath}.bak-9-20-3-${timestamp}`);

let content = fs.readFileSync(globalsPath, "utf8");

const blockRegex = new RegExp(`${start}[\\s\\S]*?${end}\\n?`, "m");

if (blockRegex.test(content)) {
  content = content.replace(blockRegex, `${lightThemeCss}\n`);
  console.log("[OK] Bloco visual 9.20.3 atualizado em globals.css.");
} else {
  content = `${content.trimEnd()}\n\n${lightThemeCss}\n`;
  console.log("[OK] Bloco visual 9.20.3 adicionado ao globals.css.");
}

fs.writeFileSync(globalsPath, content, "utf8");

console.log("");
console.log("Clareamento visual aplicado.");
console.log("Arquivo alterado: src/app/globals.css");
