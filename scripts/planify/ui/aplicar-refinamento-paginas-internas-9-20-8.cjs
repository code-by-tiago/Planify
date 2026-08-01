const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const globalsPath = path.join(root, "src", "app", "globals.css");

const start = "/* PLANIFY_INTERNAL_REFINEMENT_9_20_8_START */";
const end = "/* PLANIFY_INTERNAL_REFINEMENT_9_20_8_END */";

const css = `${start}

/*
  Planify 9.20.8 — Refinamento visual das páginas internas

  Objetivo:
  - Manter a mesma linguagem visual da home 9.20.7/9.20.6.
  - Clarear e compactar páginas internas.
  - Padronizar cards, botões, formulários, tabelas e painéis.
  - Não alterar lógica, APIs, banco, DOCX, Stripe, Admin, Biblioteca,
    Marketplace, Editor funcional, Premium Gate, login ou assinaturas.
*/

:root {
  --pl-internal-page: #fbfcff;
  --pl-internal-soft: #f5f7ff;
  --pl-internal-card: #ffffff;
  --pl-internal-card-soft: #f8fafc;
  --pl-internal-text: #101828;
  --pl-internal-soft-text: #344054;
  --pl-internal-muted: #667085;
  --pl-internal-line: rgba(15, 23, 42, 0.10);
  --pl-internal-line-strong: rgba(37, 99, 235, 0.16);
  --pl-internal-primary: #4f46e5;
  --pl-internal-blue: #2563eb;
  --pl-internal-cyan: #0891b2;
  --pl-internal-green: #047857;
  --pl-internal-amber: #92400e;
  --pl-internal-rose: #be123c;
  --pl-internal-shadow: 0 18px 50px rgba(15, 23, 42, 0.08);
  --pl-internal-shadow-soft: 0 10px 28px rgba(15, 23, 42, 0.06);
}

/* Base interna clara */
body {
  background:
    radial-gradient(circle at 5% 0%, rgba(124, 58, 237, 0.08), transparent 26rem),
    radial-gradient(circle at 95% 6%, rgba(8, 145, 178, 0.10), transparent 28rem),
    linear-gradient(180deg, #ffffff 0%, var(--pl-internal-soft) 52%, #ffffff 100%) !important;
  color: var(--pl-internal-text) !important;
}

/* Cabeçalho global */
body header {
  background: rgba(255, 255, 255, 0.92) !important;
  color: var(--pl-internal-text) !important;
  border-color: var(--pl-internal-line) !important;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04) !important;
  backdrop-filter: blur(22px);
  -webkit-backdrop-filter: blur(22px);
}

body header nav,
body header [class*="rounded-full"],
body header [class*="rounded-2xl"] {
  background: rgba(255, 255, 255, 0.82) !important;
  border-color: var(--pl-internal-line) !important;
  box-shadow: none !important;
}

/* Remove peso escuro das páginas internas sem afetar lógica */
body [class*="bg-slate-950"],
body [class*="bg-slate-900"],
body [class*="bg-slate-800"],
body [class*="bg-black"] {
  background-color: rgba(255, 255, 255, 0.94) !important;
  color: var(--pl-internal-text) !important;
}

/* Cards e superfícies */
body [class*="bg-white/"],
body [class*="bg-white\\["] {
  background-color: rgba(255, 255, 255, 0.96) !important;
}

body [class*="rounded-"][class*="border"] {
  border-color: var(--pl-internal-line) !important;
}

body [class*="shadow-2xl"],
body [class*="shadow-xl"],
body [class*="shadow-lg"] {
  box-shadow: var(--pl-internal-shadow) !important;
}

/* Cards coloridos mais suaves */
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
  color: var(--pl-internal-text) !important;
}

body [class*="text-slate-100"],
body [class*="text-slate-200"],
body [class*="text-slate-300"],
body [class*="text-gray-100"],
body [class*="text-gray-200"],
body [class*="text-gray-300"] {
  color: var(--pl-internal-soft-text) !important;
}

body [class*="text-slate-400"],
body [class*="text-slate-500"],
body [class*="text-gray-400"],
body [class*="text-gray-500"] {
  color: var(--pl-internal-muted) !important;
}

body [class*="text-cyan-100"],
body [class*="text-cyan-200"],
body [class*="text-cyan-300"],
body [class*="text-sky-100"],
body [class*="text-sky-200"],
body [class*="text-sky-300"] {
  color: var(--pl-internal-cyan) !important;
}

body [class*="text-emerald-100"],
body [class*="text-emerald-200"],
body [class*="text-emerald-300"] {
  color: var(--pl-internal-green) !important;
}

body [class*="text-amber-100"],
body [class*="text-amber-200"],
body [class*="text-amber-300"] {
  color: var(--pl-internal-amber) !important;
}

body [class*="text-rose-100"],
body [class*="text-rose-200"],
body [class*="text-rose-300"] {
  color: var(--pl-internal-rose) !important;
}

/* Hero/PageHero interno mais compacto */
body main > section:first-child,
body main > div:first-child > section:first-child {
  scroll-margin-top: 92px;
}

body main h1 {
  letter-spacing: -0.055em;
}

body main h1:not(.planify-hero__content h1) {
  font-size: clamp(2.2rem, 4.5vw, 4.15rem);
  line-height: 1;
}

body main h2 {
  letter-spacing: -0.045em;
}

/* Botões internos no padrão da home */
body button,
body a {
  text-underline-offset: 4px;
}

body button[class*="bg-white"],
body a[class*="bg-white"] {
  background: #ffffff !important;
  color: var(--pl-internal-text) !important;
  border: 1px solid var(--pl-internal-line) !important;
  box-shadow: var(--pl-internal-shadow-soft) !important;
}

body button[class*="bg-white"]:hover,
body a[class*="bg-white"]:hover {
  background: #f8fafc !important;
  border-color: var(--pl-internal-line-strong) !important;
  transform: translateY(-1px);
}

/* Botões de ação claros com destaque */
body [class*="bg-cyan-300/"] button,
body [class*="bg-blue-300/"] button,
body [class*="bg-sky-300/"] button,
body [class*="bg-emerald-300/"] button {
  border-color: rgba(37, 99, 235, 0.14) !important;
}

/* Formulários */
body input,
body textarea,
body select {
  background: #ffffff !important;
  color: var(--pl-internal-text) !important;
  border-color: var(--pl-internal-line) !important;
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.03) !important;
}

body input::placeholder,
body textarea::placeholder {
  color: #98a2b3 !important;
}

body option {
  background: #ffffff !important;
  color: var(--pl-internal-text) !important;
}

/* Tabelas e documentos */
body table {
  background: #ffffff;
}

body th,
body td {
  border-color: rgba(100, 116, 139, 0.30) !important;
}

/* Dashboard, Biblioteca, Marketplace, Admin: cards mais compactos */
body [class*="grid"] > [class*="rounded-"][class*="border"] {
  overflow: hidden;
}

body [class*="rounded-"][class*="border"][class*="p-8"],
body [class*="rounded-"][class*="border"][class*="p-10"] {
  padding: clamp(1.25rem, 2.5vw, 2rem) !important;
}

/* Áreas premium e alertas sem tom técnico */
body code {
  background: #f2f4f7;
  color: #344054;
  border: 1px solid var(--pl-internal-line);
  border-radius: 0.55rem;
  padding: 0.12rem 0.35rem;
}

/* Editor: mantém folha, mas suaviza entorno */
body .planify-editor-page {
  background: #ffffff !important;
  color: #0f172a !important;
  box-shadow: 0 26px 70px rgba(15, 23, 42, 0.14) !important;
}

body .planify-editor-page * {
  color: inherit;
}

/* Toolbar do editor mais clara e compacta */
body .planify-editor-page + *,
body .planify-editor-page ~ * {
  color: var(--pl-internal-text);
}

/* Login/Admin: cards mais profissionais */
body form,
body [class*="backdrop-blur"] {
  border-color: var(--pl-internal-line) !important;
}

/* Navbar com Admin/Entrar/Acessar painel mais limpa */
body header a[href="/admin"],
body header a[href="/login"],
body header a[href="/dashboard"] {
  border-color: var(--pl-internal-line) !important;
}

/* Microinterações */
body [class*="rounded-"][class*="border"] {
  transition:
    transform 160ms ease,
    background-color 160ms ease,
    border-color 160ms ease,
    box-shadow 160ms ease;
}

body [class*="rounded-"][class*="border"]:hover {
  border-color: rgba(37, 99, 235, 0.18) !important;
}

/* Seleção/foco */
body ::selection {
  background: rgba(37, 99, 235, 0.18);
}

body :focus-visible {
  outline: 3px solid rgba(37, 99, 235, 0.22);
  outline-offset: 2px;
}

/* Reduz espaçamentos excessivos comuns em páginas internas */
body main > section:not(.planify-hero):not(.planify-section):not(.planify-final-cta) {
  padding-top: clamp(1.5rem, 3vw, 3rem);
  padding-bottom: clamp(1.5rem, 3vw, 3rem);
}

/* Responsivo */
@media (max-width: 760px) {
  body main h1:not(.planify-hero__content h1) {
    font-size: clamp(2rem, 10vw, 3.2rem);
  }

  body [class*="rounded-"][class*="border"][class*="p-8"],
  body [class*="rounded-"][class*="border"][class*="p-10"] {
    padding: 1rem !important;
  }
}

@media print {
  body {
    background: #ffffff !important;
  }
}

${end}
`;

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function backup(file) {
  if (!fs.existsSync(file)) return;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  fs.copyFileSync(file, `${file}.bak-9-20-8-${stamp}`);
}

function removeBlock(content, blockStart, blockEnd) {
  const regex = new RegExp(`\\n?${escapeRegex(blockStart)}[\\s\\S]*?${escapeRegex(blockEnd)}\\n?`, "m");
  return content.replace(regex, "\n");
}

if (!fs.existsSync(globalsPath)) {
  console.error("ERRO: src/app/globals.css não encontrado.");
  process.exit(1);
}

backup(globalsPath);

let content = fs.readFileSync(globalsPath, "utf8");
content = removeBlock(content, start, end);
content = `${content.trimEnd()}\n\n${css}\n`;
fs.writeFileSync(globalsPath, content, "utf8");

console.log("[OK] Refinamento visual interno 9.20.8 aplicado em src/app/globals.css.");
console.log("[OK] Nenhuma lógica de página, API, banco, DOCX ou Stripe foi alterada.");
