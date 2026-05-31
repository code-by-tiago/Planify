const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const layoutPath = path.join(root, "src", "app", "layout.tsx");
const globalsPath = path.join(root, "src", "app", "globals.css");

const start = "/* PLANIFY_SMART_FIELDS_9_20_9_START */";
const end = "/* PLANIFY_SMART_FIELDS_9_20_9_END */";

const css = `${start}

/*
  Planify 9.20.9 — Campos inteligentes e textos profissionais

  Escopo:
  - Sugestões roláveis em campos de Planejamentos/Materiais
  - Compatibilidade entre etapa, ano/série, área e componente
  - Correção visual de textos com encoding quebrado no DOM
  - Separação visual de Biblioteca e Marketplace
  - Não altera APIs, DOCX, IA, Stripe, banco, login ou assinaturas
*/

.planify-smart-field {
  cursor: pointer;
}

.planify-smart-field:focus {
  border-color: rgba(79, 70, 229, 0.36) !important;
  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.10) !important;
}

.planify-smart-field-menu {
  position: absolute;
  z-index: 99999;
  display: none;
  max-height: 280px;
  overflow-y: auto;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.98);
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
  font-weight: 750;
  line-height: 1.25;
  padding: 0.72rem 0.82rem;
  text-align: left;
}

.planify-smart-field-menu__option:hover {
  background: #eef2ff;
  color: #4f46e5;
}

.planify-feature-grid--five {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.planify-generated-marketplace-link {
  margin-left: 0.75rem;
}

/* Biblioteca mais profissional */
body:has(a[href="/biblioteca"]) h1,
body:has(a[href="/marketplace"]) h1 {
  text-wrap: balance;
}

body main p {
  text-wrap: pretty;
}

/* Evita que títulos quebrem feio após correção de encoding */
body h1,
body h2,
body h3 {
  overflow-wrap: normal;
  word-break: normal;
  hyphens: none;
}

/* Ajuste dos cards em telas médias */
@media (max-width: 1180px) {
  .planify-feature-grid--five {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .planify-feature-grid--five {
    grid-template-columns: 1fr;
  }

  .planify-smart-field-menu {
    max-width: calc(100vw - 24px);
  }
}

${end}
`;

const textReplacementMap = new Map([
  ["Informações", "Informações"],
]);

const sourceFixes = [
  [/InformaÃ§Ãµes/g, "Informações"],
  [/informaÃ§Ãµes/g, "informações"],
  [/avaliaÃ§Ãµes/g, "avaliações"],
  [/AvaliaÃ§Ãµes/g, "Avaliações"],
  [/sequÃªncias/g, "sequências"],
  [/SequÃªncias/g, "Sequências"],
  [/didÃ¡ticas/g, "didáticas"],
  [/DidÃ¡ticas/g, "Didáticas"],
  [/produÃ§Ã£o/g, "produção"],
  [/ProduÃ§Ã£o/g, "Produção"],
  [/interpretaÃ§Ã£o/g, "interpretação"],
  [/InterpretaÃ§Ã£o/g, "Interpretação"],
  [/questÃµes/g, "questões"],
  [/QuestÃµes/g, "Questões"],
  [/DuraÃ§Ã£o/g, "Duração"],
  [/duraÃ§Ã£o/g, "duração"],
  [/Ano\/SÃ©rie/g, "Ano/Série"],
  [/SÃ©rie/g, "Série"],
  [/sÃ©rie/g, "série"],
  [/TÃ­tulo/g, "Título"],
  [/tÃ­tulo/g, "título"],
  [/ConteÃºdos/g, "Conteúdos"],
  [/conteÃºdos/g, "conteúdos"],
  [/pedagÃ³gic/g, "pedagógic"],
  [/PedagÃ³gic/g, "Pedagógic"],
  [/currÃ­cular/g, "curricular"],
  [/CurrÃ­cular/g, "Curricular"],
  [/Ã¡/g, "á"],
  [/Ã©/g, "é"],
  [/Ã­/g, "í"],
  [/Ã³/g, "ó"],
  [/Ãº/g, "ú"],
  [/Ã£/g, "ã"],
  [/Ãµ/g, "õ"],
  [/Ã§/g, "ç"],
  [/Ã /g, "à"],
  [/Âº/g, "º"],
  [/Âª/g, "ª"],
  [/â€”/g, "—"],
  [/â€“/g, "–"],
  [/Â/g, ""],
  [/Materiais didáticos oficiais cadastrados pelo administrador\./gi, "Materiais didáticos premium selecionados para apoiar sua rotina pedagógica."],
  [/Acesse apenas recursos reais anexados e publicados pelo admin do Planify\./gi, "Acesse recursos reais e organizados para usar, adaptar e baixar quando precisar."],
  [/cadastrados pelo administrador/gi, "selecionados para professores"],
  [/publicados pelo admin/gi, "disponíveis na Biblioteca Premium"],
  [/pelo administrador/gi, "pela curadoria Planify"],
  [/sem materiais fictícios/gi, "com materiais reais"],
  [/Quando você cadastrar materiais em \/admin\/biblioteca, eles aparecerão aqui para os professores premium\./gi, "Assim que novos materiais premium estiverem disponíveis, eles aparecerão aqui para os professores."],
  [/Assim que você cadastrar um material em \/admin\/biblioteca, ele aparecerá aqui\./gi, "Assim que novos materiais premium estiverem disponíveis, eles aparecerão aqui."],
];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function backup(file) {
  if (!fs.existsSync(file)) return;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  fs.copyFileSync(file, `${file}.bak-9-20-9-${stamp}`);
}

function removeBlock(content, blockStart, blockEnd) {
  const regex = new RegExp(`\\n?${escapeRegex(blockStart)}[\\s\\S]*?${escapeRegex(blockEnd)}\\n?`, "m");
  return content.replace(regex, "\n");
}

function patchGlobals() {
  if (!fs.existsSync(globalsPath)) {
    console.error("ERRO: src/app/globals.css não encontrado.");
    process.exit(1);
  }

  backup(globalsPath);

  let content = fs.readFileSync(globalsPath, "utf8");
  content = removeBlock(content, start, end);
  content = `${content.trimEnd()}\n\n${css}\n`;
  fs.writeFileSync(globalsPath, content, "utf8");
  console.log("[OK] CSS dos campos inteligentes aplicado.");
}

function patchLayout() {
  if (!fs.existsSync(layoutPath)) {
    console.log("[AVISO] src/app/layout.tsx não encontrado. Campo inteligente não foi importado automaticamente.");
    return;
  }

  let content = fs.readFileSync(layoutPath, "utf8");

  if (content.includes("PlanifyFieldEnhancer")) {
    console.log("[OK] PlanifyFieldEnhancer já estava importado no layout.");
    return;
  }

  backup(layoutPath);

  const importLine = 'import { PlanifyFieldEnhancer } from "../components/PlanifyFieldEnhancer";\n';
  const firstImport = content.match(/^import .*?;\n/m);

  if (firstImport) {
    content = content.replace(firstImport[0], `${firstImport[0]}${importLine}`);
  } else {
    content = `${importLine}${content}`;
  }

  const bodyRegex = /(<body[^>]*>)/m;

  if (bodyRegex.test(content)) {
    content = content.replace(bodyRegex, `$1\n        <PlanifyFieldEnhancer />`);
  } else if (content.includes("{children}")) {
    content = content.replace("{children}", "<PlanifyFieldEnhancer />\n        {children}");
  } else {
    console.log("[AVISO] Não encontrei <body> nem {children} no layout. Import inserido, mas componente não montado.");
  }

  fs.writeFileSync(layoutPath, content, "utf8");
  console.log("[OK] PlanifyFieldEnhancer montado em src/app/layout.tsx.");
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

function repairSourceTexts() {
  const files = walk(path.join(root, "src", "app"))
    .filter((file) => /\.(tsx|ts|jsx|js)$/.test(file))
    .filter((file) => !file.includes(`${path.sep}api${path.sep}`));

  let changed = 0;

  for (const file of files) {
    let content = fs.readFileSync(file, "utf8");
    const original = content;

    for (const [pattern, replacement] of sourceFixes) {
      content = content.replace(pattern, replacement);
    }

    if (content !== original) {
      backup(file);
      fs.writeFileSync(file, content, "utf8");
      changed += 1;
      console.log(`[OK] Textos corrigidos em ${path.relative(root, file)}.`);
    }
  }

  if (changed === 0) {
    console.log("[OK] Nenhum texto quebrado encontrado em src/app.");
  }
}

patchGlobals();
patchLayout();
repairSourceTexts();

console.log("");
console.log("Etapa 9.20.9 aplicada: campos inteligentes, textos profissionais e Home com Biblioteca/Marketplace separados.");
