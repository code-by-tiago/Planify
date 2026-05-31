const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const globalsPath = path.join(root, "src", "app", "globals.css");

const start = "/* PLANIFY_PLANNING_SMART_FIX_9_21_1_START */";
const end = "/* PLANIFY_PLANNING_SMART_FIX_9_21_1_END */";

const css = `${start}

/*
  Planify 9.21.1 — Ajuste pos-deploy dos campos inteligentes de Planejamentos

  Corrige:
  - Listagem completa ao clicar no campo
  - Componente curricular compativel com etapa/area
  - Lingua Espanhola no Ensino Medio
  - Campo Conteudos sem menu indevido
  - Filtro visual de habilidades BNCC repetidas/excessivas
*/

.planify-smart-field {
  cursor: pointer;
}

.planify-smart-field-menu {
  position: absolute;
  z-index: 99999;
  display: none;
  max-height: 310px;
  overflow-y: auto;
  overscroll-behavior: contain;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.99);
  box-shadow: 0 22px 60px rgba(15, 23, 42, 0.16);
  padding: 8px;
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

.planify-smart-field-menu.is-open {
  display: grid;
  gap: 4px;
}

.planify-smart-field-menu__option {
  width: 100%;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: #101828;
  cursor: pointer;
  font-size: 0.92rem;
  font-weight: 760;
  line-height: 1.25;
  padding: 0.76rem 0.86rem;
  text-align: left;
}

.planify-smart-field-menu__option:hover,
.planify-smart-field-menu__option:focus {
  background: #eef2ff;
  color: #4f46e5;
  outline: none;
}

.planify-bncc-filter-notice {
  border: 1px solid rgba(79, 70, 229, 0.16);
  border-radius: 16px;
  background: linear-gradient(135deg, #eef2ff, #ecfeff);
  color: #344054;
  font-size: 0.88rem;
  font-weight: 850;
  line-height: 1.45;
  margin-bottom: 0.85rem;
  padding: 0.82rem 0.95rem;
}

${end}
`;

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function backup(file) {
  if (!fs.existsSync(file)) return;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  fs.copyFileSync(file, `${file}.bak-9-21-1-${stamp}`);
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

console.log("[OK] CSS 9.21.1 dos campos inteligentes aplicado.");
console.log("[OK] Nenhuma API, DOCX, Stripe, Supabase, banco ou motor IA foi alterado.");
