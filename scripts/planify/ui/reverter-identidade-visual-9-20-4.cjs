const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const globalsPath = path.join(root, "src", "app", "globals.css");
const start = "/* PLANIFY_BRAND_THEME_9_20_4_START */";
const end = "/* PLANIFY_BRAND_THEME_9_20_4_END */";

function backup(file) {
  if (!fs.existsSync(file)) {
    return;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  fs.copyFileSync(file, `${file}.bak-revert-9-20-4-${timestamp}`);
}

if (fs.existsSync(globalsPath)) {
  backup(globalsPath);
  let content = fs.readFileSync(globalsPath, "utf8");
  const regex = new RegExp(`\\n?${start}[\\s\\S]*?${end}\\n?`, "m");

  if (regex.test(content)) {
    content = content.replace(regex, "\n");
    fs.writeFileSync(globalsPath, `${content.trimEnd()}\n`, "utf8");
    console.log("[OK] Bloco visual 9.20.4 removido de globals.css.");
  } else {
    console.log("[AVISO] Bloco visual 9.20.4 não encontrado em globals.css.");
  }
} else {
  console.log("[AVISO] globals.css não encontrado.");
}

console.log("");
console.log("Observação: este revert remove a camada CSS. Se o cabeçalho tiver sido trocado para PlanifyBrandLogo, use os backups .bak-9-20-4 gerados na aplicação para restaurar o arquivo específico, se desejar.");
