const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const globalsPath = path.join(root, "src", "app", "globals.css");
const start = "/* PLANIFY_CLEAN_SAAS_9_20_5_START */";
const end = "/* PLANIFY_CLEAN_SAAS_9_20_5_END */";

function backup(file) {
  if (!fs.existsSync(file)) return;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  fs.copyFileSync(file, `${file}.bak-revert-9-20-5-${stamp}`);
}

if (!fs.existsSync(globalsPath)) {
  console.error("ERRO: src/app/globals.css não encontrado.");
  process.exit(1);
}

backup(globalsPath);

let content = fs.readFileSync(globalsPath, "utf8");
const regex = new RegExp(`\\n?${start.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${end.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\n?`, "m");

if (regex.test(content)) {
  content = content.replace(regex, "\n");
  fs.writeFileSync(globalsPath, `${content.trimEnd()}\n`, "utf8");
  console.log("[OK] Tema clean 9.20.5 removido de globals.css.");
} else {
  console.log("[AVISO] Tema clean 9.20.5 não encontrado.");
}

console.log("");
console.log("Para restaurar exatamente o estado anterior, use os backups .bak-9-20-5 gerados na aplicação.");
