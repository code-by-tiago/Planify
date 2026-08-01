const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const globalsPath = path.join(root, "src", "app", "globals.css");
const pagePath = path.join(root, "src", "app", "page.tsx");
const start = "/* PLANIFY_LANDING_VIDEO_9_20_6_START */";
const end = "/* PLANIFY_LANDING_VIDEO_9_20_6_END */";

function backup(file) {
  if (!fs.existsSync(file)) return;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  fs.copyFileSync(file, `${file}.bak-revert-9-20-6-${stamp}`);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

if (fs.existsSync(globalsPath)) {
  backup(globalsPath);
  let content = fs.readFileSync(globalsPath, "utf8");
  const regex = new RegExp(`\\n?${escapeRegex(start)}[\\s\\S]*?${escapeRegex(end)}\\n?`, "m");
  content = content.replace(regex, "\n");
  fs.writeFileSync(globalsPath, `${content.trimEnd()}\n`, "utf8");
  console.log("[OK] CSS 9.20.6 removido.");
}

console.log("");
console.log("Para restaurar a home anterior, use o backup gerado:");
console.log("src/app/page.tsx.bak-9-20-6-*");
console.log("");
console.log("A reversão automática da home não foi feita para evitar sobrescrever trabalho posterior.");
