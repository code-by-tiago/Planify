const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const src = path.join(root, "src");

const replacements = new Map([
  ["á", "á"],
  ["à", "à"],
  ["â", "â"],
  ["ã", "ã"],
  ["é", "é"],
  ["ê", "ê"],
  ["í", "í"],
  ["ó", "ó"],
  ["ô", "ô"],
  ["õ", "õ"],
  ["ú", "ú"],
  ["ç", "ç"],
  ["Á", "Á"],
  ["À", "À"],
  ["Â", "Â"],
  ["Ã", "Ã"],
  ["É", "É"],
  ["Ê", "Ê"],
  ["Í", "Í"],
  ["Ó", "Ó"],
  ["Ô", "Ô"],
  ["Õ", "Õ"],
  ["Ú", "Ú"],
  ["Ç", "Ç"],
  ["º", "º"],
  ["ª", "ª"],
  ["·", "·"],
  ["•", "•"],
  ["–", "–"],
  ["—", "—"],
  ["‘", "‘"],
  ["’", "’"],
  ["“", "“"],
  ["”", "”"],
  ["”", "”"],
  ["Ã", "Á"],
]);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      files.push(...walk(full));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      files.push(full);
    }
  }

  return files;
}

function fixFile(file) {
  let text = fs.readFileSync(file, "utf8");
  const original = text;

  for (const [from, to] of replacements.entries()) {
    text = text.split(from).join(to);
  }

  if (text !== original) {
    fs.writeFileSync(file, text, "utf8");
    return true;
  }

  return false;
}

const files = walk(src);
const changed = files.filter(fixFile);

console.log("");
console.log("Planify | Correção de encoding");
console.log("");
console.log(`Arquivos verificados: ${files.length}`);
console.log(`Arquivos alterados: ${changed.length}`);

for (const file of changed) {
  console.log("- " + path.relative(root, file));
}
