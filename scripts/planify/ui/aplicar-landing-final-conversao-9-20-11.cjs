const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const globalsPath = path.join(root, "src", "app", "globals.css");

const start = "/* PLANIFY_CONVERSION_LANDING_9_20_11_START */";
const end = "/* PLANIFY_CONVERSION_LANDING_9_20_11_END */";

const css = `${start}

/*
  Planify 9.20.11 — Landing final de conversao

  Escopo:
  - Beneficios
  - Como funciona
  - Seguranca/premium sem texto tecnico
  - Depoimentos/validacao social
  - FAQ
  - CTA final
  - Nao altera APIs, banco, DOCX, Stripe, Supabase, login ou assinaturas
*/

.planify-landing--conversion .planify-hero--conversion {
  padding-bottom: clamp(1.7rem, 3vw, 2.4rem);
}

.planify-landing--conversion .planify-hero__content h1 {
  max-width: 720px;
}

.planify-benefit-strip {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.65rem;
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 clamp(1rem, 4vw, 3rem) clamp(1.4rem, 3vw, 2.2rem);
}

.planify-benefit-strip span {
  border: 1px solid rgba(15, 23, 42, 0.10);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
  color: #344054;
  font-size: 0.86rem;
  font-weight: 850;
  padding: 0.62rem 0.82rem;
}

.planify-conversion-section {
  max-width: 1160px;
  margin: 0 auto;
  padding: clamp(2rem, 4.6vw, 4.2rem) clamp(1rem, 4vw, 3rem);
}

.planify-conversion-heading {
  max-width: 780px;
  margin-bottom: 1.35rem;
}

.planify-conversion-heading span,
.planify-kicker {
  color: #4f46e5;
  font-size: 0.82rem;
  font-weight: 950;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.planify-conversion-heading h2,
.planify-security-section h2 {
  margin: 0.7rem 0 0;
  color: #101828;
  font-size: clamp(1.95rem, 3.9vw, 3.6rem);
  font-weight: 950;
  letter-spacing: -0.06em;
  line-height: 1;
}

.planify-conversion-heading p,
.planify-security-section p,
.planify-final-cta--conversion p {
  color: #667085;
  font-size: 1rem;
  line-height: 1.65;
}

.planify-how-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.85rem;
}

.planify-how-card,
.planify-testimonial-card,
.planify-faq-item {
  border: 1px solid rgba(15, 23, 42, 0.10);
  border-radius: 1.35rem;
  background: #ffffff;
  box-shadow: 0 16px 42px rgba(15, 23, 42, 0.07);
}

.planify-how-card {
  padding: 1.15rem;
}

.planify-how-card > span {
  display: grid;
  place-items: center;
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 0.9rem;
  background: #eef2ff;
  color: #4f46e5;
  font-size: 0.86rem;
  font-weight: 950;
}

.planify-how-card h3 {
  margin: 0.95rem 0 0.45rem;
  color: #101828;
  font-size: 1rem;
  font-weight: 950;
  letter-spacing: -0.03em;
}

.planify-how-card p {
  margin: 0;
  color: #667085;
  font-size: 0.9rem;
  line-height: 1.55;
}

.planify-security-section {
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(320px, 1.05fr);
  gap: 1.25rem;
  align-items: center;
}

.planify-security-section > div:first-child {
  border: 1px solid rgba(79, 70, 229, 0.13);
  border-radius: 1.7rem;
  background:
    radial-gradient(circle at 0% 0%, rgba(124, 58, 237, 0.10), transparent 18rem),
    radial-gradient(circle at 100% 0%, rgba(8, 145, 178, 0.12), transparent 18rem),
    #ffffff;
  box-shadow: 0 20px 55px rgba(15, 23, 42, 0.08);
  padding: clamp(1.35rem, 3vw, 2.1rem);
}

.planify-security-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;
}

.planify-security-grid span {
  border: 1px solid rgba(15, 23, 42, 0.10);
  border-radius: 1.25rem;
  background: #ffffff;
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.06);
  color: #344054;
  font-weight: 900;
  padding: 1rem;
}

.planify-testimonial-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.9rem;
}

.planify-testimonial-card {
  padding: 1.2rem;
}

.planify-testimonial-card p {
  margin: 0;
  color: #344054;
  font-size: 0.96rem;
  line-height: 1.62;
}

.planify-testimonial-card strong {
  display: block;
  margin-top: 1rem;
  color: #101828;
  font-size: 0.92rem;
  font-weight: 950;
}

.planify-faq-grid {
  display: grid;
  gap: 0.75rem;
}

.planify-faq-item {
  padding: 0;
  overflow: hidden;
}

.planify-faq-item summary {
  cursor: pointer;
  color: #101828;
  font-weight: 950;
  list-style: none;
  padding: 1rem 1.1rem;
}

.planify-faq-item summary::-webkit-details-marker {
  display: none;
}

.planify-faq-item summary::after {
  content: "+";
  float: right;
  color: #4f46e5;
  font-weight: 950;
}

.planify-faq-item[open] summary::after {
  content: "–";
}

.planify-faq-item p {
  border-top: 1px solid rgba(15, 23, 42, 0.08);
  color: #667085;
  line-height: 1.6;
  margin: 0;
  padding: 0.9rem 1.1rem 1.1rem;
}

.planify-final-cta--conversion p {
  max-width: 640px;
  margin: 1rem auto 0;
}

.planify-final-cta--conversion {
  margin-top: 1rem;
}

/* Remove termos tecnicos visuais remanescentes em planos/home, sem mexer em logica */
.planify-technical-note,
.stripe-technical-note,
[data-planify-technical-note="true"] {
  display: none !important;
}

@media (max-width: 1100px) {
  .planify-how-grid,
  .planify-testimonial-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .planify-security-section {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .planify-how-grid,
  .planify-testimonial-grid,
  .planify-security-grid {
    grid-template-columns: 1fr;
  }

  .planify-conversion-section {
    padding-top: 1.6rem;
    padding-bottom: 1.6rem;
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
  fs.copyFileSync(file, `${file}.bak-9-20-11-${stamp}`);
}

function removeBlock(content, blockStart, blockEnd) {
  const regex = new RegExp(`\\n?${escapeRegex(blockStart)}[\\s\\S]*?${escapeRegex(blockEnd)}\\n?`, "m");
  return content.replace(regex, "\n");
}

if (!fs.existsSync(globalsPath)) {
  console.error("ERRO: src/app/globals.css nao encontrado.");
  process.exit(1);
}

backup(globalsPath);

let content = fs.readFileSync(globalsPath, "utf8");
content = removeBlock(content, start, end);
content = `${content.trimEnd()}\n\n${css}\n`;
fs.writeFileSync(globalsPath, content, "utf8");

console.log("[OK] CSS da landing final 9.20.11 aplicado.");
console.log("[OK] Nenhuma API, banco, Stripe, Supabase, DOCX ou logica funcional foi alterada.");
