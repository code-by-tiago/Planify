const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function walk(dir, output = []) {
  if (!fs.existsSync(dir)) return output;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (["node_modules", ".next", ".git", "dist", "build"].includes(entry.name)) continue;
      walk(full, output);
      continue;
    }

    if (entry.isFile() && entry.name.toLowerCase().endsWith(".docx")) {
      output.push(full);
    }
  }

  return output;
}

const roots = ["data", "resources", "public", "src", "templates"]
  .map((item) => path.join(root, item))
  .filter((item) => fs.existsSync(item));

const files = roots.flatMap((dir) => walk(dir));
const anual = files.filter((file) => normalize(path.basename(file)).includes("anual"));
const trimestral = files.filter((file) => normalize(path.basename(file)).includes("trimestral"));

console.log("");
console.log("Planify | Verificação de modelos oficiais");
console.log("");

console.log("Modelos anuais encontrados:");
if (anual.length === 0) {
  console.log("- NENHUM");
} else {
  anual.forEach((file) => console.log("- " + path.relative(root, file)));
}

console.log("");
console.log("Modelos trimestrais encontrados:");
if (trimestral.length === 0) {
  console.log("- NENHUM");
} else {
  trimestral.forEach((file) => console.log("- " + path.relative(root, file)));
}

console.log("");

if (anual.length === 0 || trimestral.length === 0) {
  console.log("ATENÇÃO: coloque os modelos oficiais em C:\\planify\\data.");
  process.exit(1);
}

console.log("OK: modelos oficiais encontrados.");
