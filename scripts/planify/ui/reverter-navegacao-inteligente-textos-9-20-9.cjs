const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const globalsPath = path.join(root, "src", "app", "globals.css");
const start = "/* PLANIFY_SMART_FIELDS_9_20_9_START */";
const end = "/* PLANIFY_SMART_FIELDS_9_20_9_END */";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function backup(file) {
  if (!fs.existsSync(file)) return;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  fs.copyFileSync(file, `${file}.bak-revert-9-20-9-${stamp}`);
}

if (fs.existsSync(globalsPath)) {
  backup(globalsPath);
  let content = fs.readFileSync(globalsPath, "utf8");
  const regex = new RegExp(`\\n?${escapeRegex(start)}[\\s\\S]*?${escapeRegex(end)}\\n?`, "m");
  content = content.replace(regex, "\n");
  fs.writeFileSync(globalsPath, `${content.trimEnd()}\n`, "utf8");
  console.log("[OK] CSS 9.20.9 removido.");
}

console.log("");
console.log("Para restaurar layout/home/textos exatamente como antes, use os backups .bak-9-20-9 gerados nos arquivos alterados.");
