const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();

const allowedRoots = ["src", "components", "app", "lib", "docs", "scripts"]
  .map((dir) => path.join(root, dir))
  .filter((dir) => fs.existsSync(dir));

const allowedExtensions = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".cjs",
  ".mjs",
  ".md",
  ".json",
]);

const replacements = [
  // Duplo mojibake mais comum
  ["á", "á"],
  ["à", "à"],
  ["â", "â"],
  ["ã", "ã"],
  ["ç", "ç"],
  ["é", "é"],
  ["ê", "ê"],
  ["í", "í"],
  ["ó", "ó"],
  ["ô", "ô"],
  ["õ", "õ"],
  ["ú", "ú"],
  ["Á", "Á"],
  ["À", "À"],
  ["Â", "Â"],
  ["Ã", "Ã"],
  ["Ç", "Ç"],
  ["É", "É"],
  ["Ê", "Ê"],
  ["Í", "Í"],
  ["Ó", "Ó"],
  ["Ô", "Ô"],
  ["Õ", "Õ"],
  ["Ú", "Ú"],

  // Mojibake comum UTF-8 visto como Latin-1/Windows-1252
  ["á", "á"],
  ["à", "à"],
  ["â", "â"],
  ["ã", "ã"],
  ["ç", "ç"],
  ["é", "é"],
  ["ê", "ê"],
  ["í", "í"],
  ["ó", "ó"],
  ["ô", "ô"],
  ["õ", "õ"],
  ["ú", "ú"],
  ["Á", "Á"],
  ["À", "À"],
  ["Â", "Â"],
  ["Ã", "Ã"],
  ["Ç", "Ç"],
  ["É", "É"],
  ["Ê", "Ê"],
  ["Í", "Í"],
  ["Ó", "Ó"],
  ["Ô", "Ô"],
  ["Õ", "Õ"],
  ["Ú", "Ú"],

  // Variação criada por correções anteriores
  ["á", "á"],
  ["à", "à"],
  ["â", "â"],
  ["ã", "ã"],
  ["ç", "ç"],
  ["é", "é"],
  ["ê", "ê"],
  ["í", "í"],
  ["ó", "ó"],
  ["ô", "ô"],
  ["õ", "õ"],
  ["ú", "ú"],
  ["Á", "Á"],
  ["À", "À"],
  ["Â", "Â"],
  ["Ç", "Ç"],
  ["É", "É"],
  ["Ê", "Ê"],
  ["Í", "Í"],
  ["Ó", "Ó"],
  ["Ô", "Ô"],
  ["Õ", "Õ"],
  ["Ú", "Ú"],

  // Símbolos
  ["º", "º"],
  ["ª", "ª"],
  ["°", "°"],
  ["·", "·"],
  ["©", "©"],
  ["®", "®"],
  [" ", " "],

  // Aspas, travessões, bullets
  ["–", "–"],
  ["—", "—"],
  ["‘", "‘"],
  ["’", "’"],
  ["“", "“"],
  ["”", "”"],
  ["•", "•"],
  ["…", "…"],
  ["”", "”"],

  // Caracter inválido
  ["", ""],
];

const phraseFixes = [
  ["Informações", "Informações"],
  ["Informações", "Informações"],
  ["Informações", "Informações"],
  ["Avaliações", "Avaliações"],
  ["avaliações", "avaliações"],
  ["questões", "questões"],
  ["conteúdos", "conteúdos"],
  ["conteúdos", "conteúdos"],
  ["sequências", "sequências"],
  ["pedagógicos", "pedagógicos"],
  ["pedagógica", "pedagógica"],
  ["didáticos", "didáticos"],
  ["didáticas", "didáticas"],
  ["História", "História"],
  ["série", "série"],
  ["Série", "Série"],
  ["Ano/Série", "Ano/Série"],
  ["gestão", "gestão"],
  ["Gestão", "Gestão"],
];

function walk(dir) {
  const result = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (["node_modules", ".next", ".git", "dist", "build"].includes(entry.name)) {
        continue;
      }

      result.push(...walk(fullPath));
      continue;
    }

    if (entry.isFile() && allowedExtensions.has(path.extname(entry.name))) {
      result.push(fullPath);
    }
  }

  return result;
}

function fixOnce(text) {
  let output = text;

  for (const [from, to] of replacements) {
    output = output.split(from).join(to);
  }

  for (const [from, to] of phraseFixes) {
    output = output.split(from).join(to);
  }

  return output;
}

function fixDeep(text) {
  let current = text;

  for (let i = 0; i < 5; i += 1) {
    const next = fixOnce(current);

    if (next === current) {
      break;
    }

    current = next;
  }

  return current;
}

function hasSuspiciousEncoding(text) {
  return /Ã|Â|”|ç|õ|ã|é|ê|á|ó|ú|í|/.test(text);
}

function getSuspiciousLines(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const lines = text.split(/\r?\n/);
  const output = [];

  lines.forEach((line, index) => {
    if (hasSuspiciousEncoding(line)) {
      output.push({
        line: index + 1,
        text: line.trim().slice(0, 220),
      });
    }
  });

  return output.slice(0, 20);
}

const files = [...new Set(allowedRoots.flatMap(walk))];
const changed = [];

for (const file of files) {
  const original = fs.readFileSync(file, "utf8");
  const fixed = fixDeep(original);

  if (fixed !== original) {
    fs.copyFileSync(file, `${file}.bak-encoding-v2`);
    fs.writeFileSync(file, fixed, "utf8");
    changed.push(file);
  }
}

const remaining = files
  .map((file) => ({
    file,
    lines: getSuspiciousLines(file),
  }))
  .filter((item) => item.lines.length > 0);

console.log("");
console.log("Planify | Encoding V2");
console.log("");
console.log(`Arquivos verificados: ${files.length}`);
console.log(`Arquivos corrigidos: ${changed.length}`);

if (changed.length > 0) {
  console.log("");
  console.log("Arquivos corrigidos:");
  for (const file of changed) {
    console.log("- " + path.relative(root, file));
  }
}

console.log("");

if (remaining.length === 0) {
  console.log("OK: nenhuma marca comum de texto quebrado encontrada.");
} else {
  console.log("ATENÇÃO: ainda sobraram marcas suspeitas:");
  console.log("");

  for (const item of remaining) {
    console.log(path.relative(root, item.file));

    for (const line of item.lines) {
      console.log(`  linha ${line.line}: ${line.text}`);
    }

    console.log("");
  }

  console.log("Se aparecer algo aqui, copie este resultado e envie antes de seguir.");
}
