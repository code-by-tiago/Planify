const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();

const directories = ["src", "scripts", "docs"]
  .map((dir) => path.join(root, dir))
  .filter((dir) => fs.existsSync(dir));

const extensions = new Set([".ts", ".tsx", ".js", ".jsx", ".cjs", ".mjs", ".md", ".json"]);

const replacements = [
  ["\u00c3\u00a1", "á"],
  ["\u00c3\u00a0", "à"],
  ["\u00c3\u00a2", "â"],
  ["\u00c3\u00a3", "ã"],
  ["\u00c3\u00a4", "ä"],
  ["\u00c3\u00a5", "å"],
  ["\u00c3\u00a7", "ç"],
  ["\u00c3\u00a8", "è"],
  ["\u00c3\u00a9", "é"],
  ["\u00c3\u00aa", "ê"],
  ["\u00c3\u00ab", "ë"],
  ["\u00c3\u00ac", "ì"],
  ["\u00c3\u00ad", "í"],
  ["\u00c3\u00ae", "î"],
  ["\u00c3\u00af", "ï"],
  ["\u00c3\u00b1", "ñ"],
  ["\u00c3\u00b2", "ò"],
  ["\u00c3\u00b3", "ó"],
  ["\u00c3\u00b4", "ô"],
  ["\u00c3\u00b5", "õ"],
  ["\u00c3\u00b6", "ö"],
  ["\u00c3\u00b9", "ù"],
  ["\u00c3\u00ba", "ú"],
  ["\u00c3\u00bb", "û"],
  ["\u00c3\u00bc", "ü"],

  ["\u00c3\u0081", "Á"],
  ["\u00c3\u0080", "À"],
  ["\u00c3\u0082", "Â"],
  ["\u00c3\u0083", "Ã"],
  ["\u00c3\u0084", "Ä"],
  ["\u00c3\u0087", "Ç"],
  ["\u00c3\u0088", "È"],
  ["\u00c3\u0089", "É"],
  ["\u00c3\u008a", "Ê"],
  ["\u00c3\u008b", "Ë"],
  ["\u00c3\u008c", "Ì"],
  ["\u00c3\u008d", "Í"],
  ["\u00c3\u008e", "Î"],
  ["\u00c3\u008f", "Ï"],
  ["\u00c3\u0091", "Ñ"],
  ["\u00c3\u0092", "Ò"],
  ["\u00c3\u0093", "Ó"],
  ["\u00c3\u0094", "Ô"],
  ["\u00c3\u0095", "Õ"],
  ["\u00c3\u0096", "Ö"],
  ["\u00c3\u0099", "Ù"],
  ["\u00c3\u009a", "Ú"],
  ["\u00c3\u009b", "Û"],
  ["\u00c3\u009c", "Ü"],

  ["\u00c2\u00ba", "º"],
  ["\u00c2\u00aa", "ª"],
  ["\u00c2\u00b0", "°"],
  ["\u00c2\u00b7", "·"],
  ["\u00c2\u00a0", " "],

  ["\u00e2\u0080\u0093", "–"],
  ["\u00e2\u0080\u0094", "—"],
  ["\u00e2\u0080\u0098", "‘"],
  ["\u00e2\u0080\u0099", "’"],
  ["\u00e2\u0080\u009c", "“"],
  ["\u00e2\u0080\u009d", "”"],
  ["\u00e2\u0080\u00a2", "•"],
  ["\u00e2\u0080\u00a6", "…"],

  ["\ufffd", ""],
];

const targetedTextFixes = [
  ["Informações", "Informações"],
  ["Informações", "Informações"],
  ["avaliações", "avaliações"],
  ["avaliações", "avaliações"],
  ["questões", "questões"],
  ["questões", "questões"],
  ["conteúdos", "conteúdos"],
  ["conteúdos", "conteúdos"],
  ["sequências", "sequências"],
  ["sequências", "sequências"],
  ["didáticas", "didáticas"],
  ["didáticas", "didáticas"],
  ["pedagógica", "pedagógica"],
  ["pedagógica", "pedagógica"],
  ["pedagógico", "pedagógico"],
  ["pedagógico", "pedagógico"],
  ["Título", "Título"],
  ["Título", "Título"],
  ["Ano/Série", "Ano/Série"],
  ["Ano/Série", "Ano/Série"],
  ["História", "História"],
  ["História", "História"],
  ["será", "será"],
  ["será", "será"],
  ["está", "está"],
  ["está", "está"],
  ["não", "não"],
  ["não", "não"],
  ["à etapa", "à etapa"],
  ["à etapa", "à etapa"],
];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const output = [];

  for (const entry of entries) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") {
        continue;
      }

      output.push(...walk(full));
      continue;
    }

    if (entry.isFile() && extensions.has(path.extname(entry.name))) {
      output.push(full);
    }
  }

  return output;
}

function fixText(text) {
  let result = text;

  for (const [from, to] of replacements) {
    result = result.split(from).join(to);
  }

  for (const [from, to] of targetedTextFixes) {
    result = result.split(from).join(to);
  }

  return result;
}

function containsMojibake(text) {
  return /Ã|Â|”|/.test(text);
}

const files = directories.flatMap(walk);
const changed = [];

for (const file of files) {
  const original = fs.readFileSync(file, "utf8");
  const fixed = fixText(original);

  if (fixed !== original) {
    fs.writeFileSync(file, fixed, "utf8");
    changed.push(file);
  }
}

const remaining = [];

for (const file of files) {
  const text = fs.readFileSync(file, "utf8");

  if (containsMojibake(text)) {
    remaining.push(file);
  }
}

console.log("");
console.log("Planify | Correção definitiva de encoding");
console.log("");
console.log(`Arquivos verificados: ${files.length}`);
console.log(`Arquivos alterados: ${changed.length}`);

if (changed.length > 0) {
  console.log("");
  console.log("Alterados:");
  for (const file of changed) {
    console.log("- " + path.relative(root, file));
  }
}

console.log("");

if (remaining.length > 0) {
  console.log("ATENÇÃO: ainda existem possíveis marcas de encoding quebrado:");
  for (const file of remaining) {
    console.log("- " + path.relative(root, file));
  }
  console.log("");
  console.log("Revise estes arquivos manualmente se ainda houver texto quebrado na tela.");
} else {
  console.log("OK: nenhuma marca comum de texto quebrado encontrada.");
}
