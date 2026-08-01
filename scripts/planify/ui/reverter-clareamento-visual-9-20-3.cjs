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

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
fs.copyFileSync(globalsPath, `${globalsPath}.bak-revert-9-20-3-${timestamp}`);

let content = fs.readFileSync(globalsPath, "utf8");
const blockRegex = new RegExp(`\\n?${start}[\\s\\S]*?${end}\\n?`, "m");

if (blockRegex.test(content)) {
  content = content.replace(blockRegex, "\n");
  fs.writeFileSync(globalsPath, content.trimEnd() + "\n", "utf8");
  console.log("[OK] Clareamento visual 9.20.3 removido de globals.css.");
} else {
  console.log("[AVISO] Bloco 9.20.3 não encontrado. Nada foi removido.");
}
