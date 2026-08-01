const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const globalsPath = path.join(root, "src", "app", "globals.css");
const start = "/* PLANIFY_INTERNAL_REFINEMENT_9_20_8_START */";
const end = "/* PLANIFY_INTERNAL_REFINEMENT_9_20_8_END */";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function backup(file) {
  if (!fs.existsSync(file)) return;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  fs.copyFileSync(file, `${file}.bak-revert-9-20-8-${stamp}`);
}

if (!fs.existsSync(globalsPath)) {
  console.error("ERRO: src/app/globals.css não encontrado.");
  process.exit(1);
}

backup(globalsPath);

let content = fs.readFileSync(globalsPath, "utf8");
const regex = new RegExp(`\\n?${escapeRegex(start)}[\\s\\S]*?${escapeRegex(end)}\\n?`, "m");

if (regex.test(content)) {
  content = content.replace(regex, "\n");
  fs.writeFileSync(globalsPath, `${content.trimEnd()}\n`, "utf8");
  console.log("[OK] Refinamento visual interno 9.20.8 removido.");
} else {
  console.log("[AVISO] Bloco 9.20.8 não encontrado. Nada foi removido.");
}
