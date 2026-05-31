const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const globalsPath = path.join(root, "src", "app", "globals.css");

const start = "/* PLANIFY_LANDING_VIDEO_9_20_6_START */";
const end = "/* PLANIFY_LANDING_VIDEO_9_20_6_END */";

const removeBlocks = [
  ["/* PLANIFY_LIGHT_THEME_9_20_3_START */", "/* PLANIFY_LIGHT_THEME_9_20_3_END */"],
  ["/* PLANIFY_BRAND_THEME_9_20_4_START */", "/* PLANIFY_BRAND_THEME_9_20_4_END */"],
  ["/* PLANIFY_CLEAN_SAAS_9_20_5_START */", "/* PLANIFY_CLEAN_SAAS_9_20_5_END */"],
  [start, end],
];

const css = `${start}

/*
  Planify 9.20.6 — Landing premium com hero vídeo

  Escopo:
  - Nova home visual de alto nível
  - Hero com área de vídeo pedagógico/fallback animado
  - Visual limpo, claro e profissional
  - Não altera APIs, banco, DOCX, Stripe, Admin, Biblioteca, Marketplace,
    Editor funcional, Premium Gate ou rotas internas
*/

:root {
  --pl-page: #fbfcff;
  --pl-soft: #f5f7ff;
  --pl-card: #ffffff;
  --pl-card-soft: #f8fafc;
  --pl-text: #101828;
  --pl-muted: #667085;
  --pl-line: rgba(15, 23, 42, 0.10);
  --pl-indigo: #4f46e5;
  --pl-blue: #2563eb;
  --pl-cyan: #0891b2;
  --pl-teal: #0d9488;
  --pl-purple: #7c3aed;
  --pl-shadow: 0 28px 80px rgba(15, 23, 42, 0.10);
  --pl-shadow-soft: 0 16px 42px rgba(15, 23, 42, 0.08);
}

html,
body {
  background:
    radial-gradient(circle at 8% 5%, rgba(124, 58, 237, 0.12), transparent 28rem),
    radial-gradient(circle at 92% 8%, rgba(8, 145, 178, 0.14), transparent 30rem),
    linear-gradient(180deg, #ffffff 0%, var(--pl-soft) 52%, #ffffff 100%) !important;
  color: var(--pl-text) !important;
}

/* Mantém páginas internas mais claras sem mexer em lógica */
body [class*="bg-slate-950"],
body [class*="bg-slate-900"],
body [class*="bg-slate-800"],
body [class*="bg-black"] {
  background-color: rgba(255,255,255,0.94) !important;
  color: var(--pl-text) !important;
}

body [class*="text-white"] {
  color: var(--pl-text) !important;
}

body [class*="text-slate-100"],
body [class*="text-slate-200"],
body [class*="text-slate-300"] {
  color: #344054 !important;
}

body [class*="text-slate-400"],
body [class*="text-slate-500"] {
  color: var(--pl-muted) !important;
}

body [class*="border-white/"],
body [class*="border-slate-"],
body [class*="border-cyan-300/"] {
  border-color: var(--pl-line) !important;
}

body input,
body textarea,
body select {
  background: #ffffff !important;
  color: var(--pl-text) !important;
  border-color: var(--pl-line) !important;
}

/* Logo */
.planify-brand-logo {
  min-width: fit-content;
  color: var(--pl-text);
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
  color: var(--pl-text);
  font-size: 1.35rem;
  font-weight: 950;
  letter-spacing: -0.045em;
}

.planify-brand-logo__tagline {
  margin-top: 0.25rem;
  color: var(--pl-muted);
  font-size: 0.78rem;
  font-weight: 700;
}

/* Landing */
.planify-landing {
  min-height: 100vh;
  color: var(--pl-text);
  overflow-x: hidden;
}

.planify-public-header {
  position: sticky;
  top: 0;
  z-index: 50;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 1.25rem;
  padding: 1rem clamp(1rem, 4vw, 3rem);
  background: rgba(255, 255, 255, 0.88);
  border-bottom: 1px solid var(--pl-line);
  backdrop-filter: blur(22px);
  -webkit-backdrop-filter: blur(22px);
}

.planify-header-brand {
  display: inline-flex;
  width: fit-content;
  text-decoration: none;
}

.planify-header-nav,
.planify-header-actions {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.planify-header-nav {
  justify-content: center;
  border: 1px solid var(--pl-line);
  border-radius: 999px;
  background: rgba(255,255,255,0.72);
  padding: 0.35rem;
}

.planify-header-nav a,
.planify-header-actions a {
  text-decoration: none;
}

.planify-header-nav a {
  color: #344054;
  font-size: 0.94rem;
  font-weight: 750;
  padding: 0.75rem 1rem;
  border-radius: 999px;
}

.planify-header-nav a:hover {
  background: #f2f4f7;
  color: var(--pl-indigo);
}

.planify-header-actions {
  justify-content: flex-end;
}

/* Botões */
.planify-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  min-height: 44px;
  border-radius: 999px;
  border: 1px solid transparent;
  padding: 0.75rem 1.15rem;
  font-weight: 850;
  text-decoration: none;
  transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease;
}

.planify-btn:hover {
  transform: translateY(-1px);
}

.planify-btn--large {
  min-height: 54px;
  padding: 0.9rem 1.45rem;
  font-size: 1rem;
}

.planify-btn--primary {
  background: linear-gradient(135deg, var(--pl-indigo), var(--pl-blue));
  color: #ffffff !important;
  box-shadow: 0 18px 40px rgba(37, 99, 235, 0.22);
}

.planify-btn--primary:hover {
  box-shadow: 0 22px 50px rgba(37, 99, 235, 0.28);
}

.planify-btn--secondary,
.planify-btn--ghost {
  background: #ffffff;
  color: var(--pl-text) !important;
  border-color: var(--pl-line);
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
}

/* Hero */
.planify-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.02fr) minmax(420px, 0.98fr);
  gap: clamp(2rem, 4vw, 4rem);
  align-items: center;
  max-width: 1240px;
  margin: 0 auto;
  padding: clamp(3rem, 7vw, 6.5rem) clamp(1rem, 4vw, 3rem) 3.5rem;
}

.planify-hero__content h1 {
  max-width: 760px;
  margin: 1.2rem 0 1.25rem;
  font-size: clamp(3.2rem, 7.2vw, 6.2rem);
  line-height: 0.92;
  letter-spacing: -0.075em;
  font-weight: 980;
  color: #101828;
}

.planify-hero__lead {
  max-width: 660px;
  color: #475467;
  font-size: clamp(1.05rem, 2vw, 1.32rem);
  line-height: 1.65;
  letter-spacing: -0.02em;
}

.planify-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  border: 1px solid rgba(79, 70, 229, 0.16);
  background: rgba(255,255,255,0.82);
  border-radius: 999px;
  padding: 0.55rem 0.8rem;
  color: var(--pl-indigo);
  font-size: 0.86rem;
  font-weight: 850;
  box-shadow: 0 10px 28px rgba(15,23,42,0.05);
}

.planify-pill__dot {
  width: 0.65rem;
  height: 0.65rem;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--pl-purple), var(--pl-cyan));
  box-shadow: 0 0 0 6px rgba(37, 99, 235, 0.08);
}

.planify-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
  margin-top: 2rem;
}

.planify-hero__proof {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-top: 1.8rem;
}

.planify-hero__proof span {
  border: 1px solid var(--pl-line);
  background: rgba(255,255,255,0.82);
  border-radius: 999px;
  padding: 0.52rem 0.72rem;
  color: #475467;
  font-size: 0.82rem;
  font-weight: 800;
}

/* Hero video */
.planify-hero__media {
  position: relative;
}

.planify-video-card {
  position: relative;
  border: 1px solid rgba(15, 23, 42, 0.10);
  border-radius: 2rem;
  background: #ffffff;
  box-shadow: var(--pl-shadow);
  overflow: hidden;
}

.planify-video-card::before {
  content: "";
  position: absolute;
  inset: -35%;
  background:
    radial-gradient(circle, rgba(124, 58, 237, 0.18), transparent 24rem),
    radial-gradient(circle, rgba(8, 145, 178, 0.18), transparent 24rem);
  z-index: 0;
  animation: planifyFloatGlow 9s ease-in-out infinite alternate;
}

.planify-video-card > * {
  position: relative;
  z-index: 1;
}

.planify-video-card__topbar {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 1rem 1.1rem;
  border-bottom: 1px solid var(--pl-line);
  background: rgba(255,255,255,0.76);
}

.planify-video-card__topbar span {
  width: 0.72rem;
  height: 0.72rem;
  border-radius: 999px;
  background: #e4e7ec;
}

.planify-video-card__topbar strong {
  margin-left: auto;
  color: #475467;
  font-size: 0.82rem;
  font-weight: 850;
}

.planify-video-frame {
  position: relative;
  min-height: 440px;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(16,24,40,0.18), rgba(16,24,40,0.54)),
    radial-gradient(circle at 18% 20%, rgba(124, 58, 237, 0.35), transparent 18rem),
    radial-gradient(circle at 80% 25%, rgba(6, 182, 212, 0.32), transparent 18rem),
    linear-gradient(135deg, #1e1b4b, #0f172a);
}

.planify-video-frame__video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.35;
}

.planify-video-frame__fallback {
  position: absolute;
  inset: 0;
  padding: 2rem;
}

.planify-classroom {
  position: relative;
  width: 100%;
  height: 100%;
}

.planify-board {
  position: absolute;
  left: 4%;
  top: 8%;
  width: 68%;
  border: 1px solid rgba(255,255,255,0.22);
  border-radius: 1.45rem;
  background: rgba(255,255,255,0.13);
  padding: 1.35rem;
  color: #ffffff;
  backdrop-filter: blur(18px);
  animation: planifyRise 700ms ease both;
}

.planify-board span {
  display: inline-flex;
  margin-bottom: 0.65rem;
  color: #a5f3fc;
  font-size: 0.8rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.16em;
}

.planify-board strong {
  display: block;
  font-size: clamp(1.55rem, 3vw, 2.3rem);
  line-height: 1;
  letter-spacing: -0.05em;
}

.planify-board small {
  display: block;
  margin-top: 0.75rem;
  color: rgba(255,255,255,0.76);
  font-size: 0.95rem;
}

.planify-teacher-card,
.planify-ai-card {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 0.85rem;
  border: 1px solid rgba(255,255,255,0.20);
  border-radius: 1.25rem;
  background: rgba(255,255,255,0.90);
  padding: 1rem;
  color: var(--pl-text);
  box-shadow: 0 20px 55px rgba(0,0,0,0.20);
  backdrop-filter: blur(16px);
}

.planify-teacher-card {
  right: 4%;
  bottom: 10%;
  width: min(300px, 72%);
  animation: planifyFloat 5s ease-in-out infinite;
}

.planify-ai-card {
  left: 7%;
  bottom: 18%;
  width: min(330px, 78%);
  animation: planifyFloat 5.8s ease-in-out infinite reverse;
}

.planify-avatar,
.planify-ai-card__spark {
  display: grid;
  place-items: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 1rem;
  color: #ffffff;
  font-weight: 950;
  background: linear-gradient(135deg, var(--pl-indigo), var(--pl-cyan));
}

.planify-teacher-card strong,
.planify-ai-card strong {
  display: block;
  font-size: 0.95rem;
}

.planify-teacher-card span,
.planify-ai-card span {
  display: block;
  margin-top: 0.2rem;
  color: #667085;
  font-size: 0.82rem;
  line-height: 1.35;
}

.planify-play {
  position: absolute;
  left: 50%;
  top: 50%;
  display: grid;
  place-items: center;
  width: 5.3rem;
  height: 5.3rem;
  border: 0;
  border-radius: 999px;
  background: rgba(255,255,255,0.90);
  color: var(--pl-indigo);
  font-size: 1.55rem;
  box-shadow: 0 20px 45px rgba(0,0,0,0.20);
  transform: translate(-50%, -50%);
}

.planify-video-card__footer {
  display: grid;
  grid-template-columns: 1fr 150px;
  gap: 1rem;
  align-items: center;
  padding: 1.1rem;
  border-top: 1px solid var(--pl-line);
  background: rgba(255,255,255,0.88);
}

.planify-video-card__footer strong,
.planify-video-card__footer span {
  display: block;
}

.planify-video-card__footer strong {
  color: var(--pl-text);
  font-size: 0.96rem;
}

.planify-video-card__footer span {
  margin-top: 0.2rem;
  color: var(--pl-muted);
  font-size: 0.82rem;
}

.planify-progress {
  height: 0.65rem;
  overflow: hidden;
  border-radius: 999px;
  background: #e4e7ec;
}

.planify-progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--pl-indigo), var(--pl-cyan));
}

/* Seções */
.planify-section {
  max-width: 1180px;
  margin: 0 auto;
  padding: clamp(3rem, 6vw, 5rem) clamp(1rem, 4vw, 3rem);
}

.planify-section--compact {
  padding-top: 2rem;
}

.planify-section__header {
  max-width: 780px;
  margin-bottom: 1.8rem;
}

.planify-section__header span,
.planify-workflow__text span,
.planify-final-cta span {
  color: var(--pl-indigo);
  font-size: 0.86rem;
  font-weight: 950;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.planify-section__header h2,
.planify-workflow__text h2,
.planify-final-cta h2 {
  margin: 0.8rem 0 0;
  color: var(--pl-text);
  font-size: clamp(2.15rem, 4.6vw, 4.1rem);
  line-height: 0.98;
  letter-spacing: -0.065em;
  font-weight: 950;
}

.planify-feature-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.planify-feature-card {
  border: 1px solid var(--pl-line);
  border-radius: 1.6rem;
  background: #ffffff;
  padding: 1.4rem;
  box-shadow: var(--pl-shadow-soft);
  transition: transform 180ms ease, box-shadow 180ms ease;
}

.planify-feature-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--pl-shadow);
}

.planify-feature-card__icon {
  display: grid;
  place-items: center;
  width: 2.8rem;
  height: 2.8rem;
  border-radius: 1rem;
  background: linear-gradient(135deg, #eef2ff, #ecfeff);
  color: var(--pl-indigo);
  font-weight: 950;
}

.planify-feature-card h3 {
  margin: 1.1rem 0 0.55rem;
  font-size: 1.08rem;
  letter-spacing: -0.03em;
  font-weight: 950;
}

.planify-feature-card p {
  color: var(--pl-muted);
  font-size: 0.94rem;
  line-height: 1.65;
}

.planify-feature-card a {
  display: inline-flex;
  margin-top: 1rem;
  color: var(--pl-indigo);
  font-weight: 900;
  text-decoration: none;
}

/* Workflow */
.planify-workflow {
  display: grid;
  grid-template-columns: 0.92fr 1.08fr;
  gap: 2rem;
  align-items: center;
}

.planify-workflow__text p {
  max-width: 560px;
  margin: 1rem 0 1.5rem;
  color: var(--pl-muted);
  font-size: 1.03rem;
  line-height: 1.7;
}

.planify-workflow__steps {
  display: grid;
  gap: 0.85rem;
}

.planify-step {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1rem;
  align-items: center;
  border: 1px solid var(--pl-line);
  border-radius: 1.35rem;
  background: #ffffff;
  padding: 1rem;
  box-shadow: var(--pl-shadow-soft);
}

.planify-step span {
  display: grid;
  place-items: center;
  width: 3rem;
  height: 3rem;
  border-radius: 1rem;
  background: #eef2ff;
  color: var(--pl-indigo);
  font-weight: 950;
}

.planify-step strong {
  color: var(--pl-text);
  font-size: 1rem;
}

/* Preview */
.planify-dashboard-preview {
  padding-top: 1rem;
}

.planify-dashboard-preview__panel {
  display: grid;
  grid-template-columns: 250px 1fr;
  min-height: 420px;
  overflow: hidden;
  border: 1px solid var(--pl-line);
  border-radius: 2rem;
  background: #ffffff;
  box-shadow: var(--pl-shadow);
}

.planify-dashboard-preview__sidebar {
  display: grid;
  align-content: start;
  gap: 0.55rem;
  border-right: 1px solid var(--pl-line);
  background: #f8fafc;
  padding: 1rem;
}

.planify-dashboard-preview__sidebar span {
  border-radius: 1rem;
  padding: 0.9rem 1rem;
  color: #667085;
  font-weight: 850;
}

.planify-dashboard-preview__sidebar .active {
  background: #eef2ff;
  color: var(--pl-indigo);
}

.planify-dashboard-preview__content {
  padding: 1.2rem;
}

.planify-dashboard-preview__toolbar {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid var(--pl-line);
  padding-bottom: 1rem;
  color: var(--pl-muted);
}

.planify-dashboard-preview__toolbar strong {
  color: var(--pl-text);
}

.planify-doc-preview {
  margin: 1.4rem auto 0;
  max-width: 720px;
  border: 1px solid var(--pl-line);
  border-radius: 1rem;
  background: #ffffff;
  padding: 1.5rem;
  box-shadow: var(--pl-shadow-soft);
}

.planify-doc-preview .line {
  height: 0.8rem;
  width: 70%;
  margin-bottom: 0.75rem;
  border-radius: 999px;
  background: #e4e7ec;
}

.planify-doc-preview .line.wide {
  width: 92%;
  height: 1.1rem;
}

.planify-doc-preview .line.small {
  width: 42%;
}

.planify-doc-preview .table {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  overflow: hidden;
  border: 1px solid #d0d5dd;
  border-radius: 0.75rem;
  margin: 1.2rem 0;
}

.planify-doc-preview .table span {
  min-height: 4.2rem;
  background: #f8fafc;
}

/* CTA final */
.planify-final-cta {
  max-width: 1040px;
  margin: 2rem auto 5rem;
  border: 1px solid rgba(79, 70, 229, 0.16);
  border-radius: 2rem;
  background:
    radial-gradient(circle at 10% 20%, rgba(124, 58, 237, 0.12), transparent 20rem),
    radial-gradient(circle at 90% 0%, rgba(8, 145, 178, 0.16), transparent 22rem),
    #ffffff;
  padding: clamp(2rem, 5vw, 4rem);
  text-align: center;
  box-shadow: var(--pl-shadow);
}

.planify-final-cta h2 {
  max-width: 780px;
  margin-left: auto;
  margin-right: auto;
}

.planify-final-cta div {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.85rem;
  margin-top: 1.7rem;
}

/* Editor: preservar folha */
body .planify-editor-page {
  background: #ffffff !important;
  color: #0f172a !important;
}

/* Animações */
@keyframes planifyFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}

@keyframes planifyFloatGlow {
  0% { transform: translate3d(-3%, -2%, 0) rotate(0deg); }
  100% { transform: translate3d(3%, 2%, 0) rotate(8deg); }
}

@keyframes planifyRise {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Responsivo */
@media (max-width: 1100px) {
  .planify-public-header {
    grid-template-columns: 1fr auto;
  }

  .planify-header-nav {
    display: none;
  }

  .planify-hero,
  .planify-workflow {
    grid-template-columns: 1fr;
  }

  .planify-hero__content h1 {
    max-width: 900px;
  }

  .planify-feature-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .planify-dashboard-preview__panel {
    grid-template-columns: 1fr;
  }

  .planify-dashboard-preview__sidebar {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    border-right: 0;
    border-bottom: 1px solid var(--pl-line);
  }
}

@media (max-width: 720px) {
  .planify-public-header {
    padding: 0.85rem 1rem;
  }

  .planify-brand-logo__tagline,
  .planify-header-actions .planify-btn--ghost {
    display: none;
  }

  .planify-hero {
    grid-template-columns: 1fr;
    padding-top: 2.5rem;
  }

  .planify-hero__content h1 {
    font-size: clamp(2.6rem, 14vw, 4rem);
  }

  .planify-video-frame {
    min-height: 360px;
  }

  .planify-feature-grid {
    grid-template-columns: 1fr;
  }

  .planify-dashboard-preview__sidebar {
    grid-template-columns: 1fr;
  }

  .planify-video-card__footer {
    grid-template-columns: 1fr;
  }
}

${end}
`;

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function removeBlock(content, blockStart, blockEnd) {
  const regex = new RegExp(`\\n?${escapeRegex(blockStart)}[\\s\\S]*?${escapeRegex(blockEnd)}\\n?`, "m");
  return content.replace(regex, "\n");
}

function backup(file) {
  if (!fs.existsSync(file)) return;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  fs.copyFileSync(file, `${file}.bak-9-20-6-${stamp}`);
}

if (!fs.existsSync(globalsPath)) {
  console.error("ERRO: src/app/globals.css não encontrado.");
  process.exit(1);
}

backup(globalsPath);

let content = fs.readFileSync(globalsPath, "utf8");

for (const [blockStart, blockEnd] of removeBlocks) {
  content = removeBlock(content, blockStart, blockEnd);
}

content = `${content.trimEnd()}\n\n${css}\n`;
fs.writeFileSync(globalsPath, content, "utf8");

console.log("[OK] CSS da landing 9.20.6 aplicado em src/app/globals.css.");
console.log("[OK] Camadas visuais 9.20.3, 9.20.4 e 9.20.5 removidas se existiam.");
