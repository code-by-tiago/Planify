const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();

function fileExists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function backup(relativePath) {
  const target = path.join(root, relativePath);

  if (!fs.existsSync(target)) {
    return false;
  }

  const backupPath = `${target}.bak-9-16-1`;
  fs.copyFileSync(target, backupPath);
  return true;
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function write(relativePath, text) {
  fs.writeFileSync(path.join(root, relativePath), text, "utf8");
}

function replaceAll(text, pairs) {
  let next = text;

  for (const [from, to] of pairs) {
    next = next.split(from).join(to);
  }

  return next;
}

const materialPath = "src/app/materiais/MateriaisClient.tsx";

const encodingPairs = [
  ["Atividade de leitura e interpretaÃƒÂ§ÃƒÂ£o", "Atividade de leitura e interpretação"],
  ["5Ã‚Âº ano", "5º ano"],
  ["LÃƒÂ­ngua Portuguesa", "Língua Portuguesa"],
  ["Leitura e interpretaÃƒÂ§ÃƒÂ£o de textos", "Leitura e interpretação de textos"],
  ["2 perÃƒÂ­odos", "2 períodos"],
  ["Desenvolver leitura, interpretaÃƒÂ§ÃƒÂ£o e produÃƒÂ§ÃƒÂ£o escrita.", "Desenvolver leitura, interpretação e produção escrita."],
  ["Leitura de texto narrativo\\nLocalizaÃƒÂ§ÃƒÂ£o de informaÃƒÂ§ÃƒÂµes explÃƒÂ­citas\\nInferÃƒÂªncia de sentidos\\nProduÃƒÂ§ÃƒÂ£o de respostas escritas", "Leitura de texto narrativo\\nLocalização de informações explícitas\\nInferência de sentidos\\nProdução de respostas escritas"],
  ["Ler o texto com atenÃƒÂ§ÃƒÂ£o, responder com frases completas e revisar a escrita antes de entregar.", "Ler o texto com atenção, responder com frases completas e revisar a escrita antes de entregar."],

  ["interpretaÃƒÂ§ÃƒÂ£o", "interpretação"],
  ["InterpretaÃƒÂ§ÃƒÂ£o", "Interpretação"],
  ["informaÃƒÂ§ÃƒÂµes", "informações"],
  ["InformaÃƒÂ§ÃƒÂµes", "Informações"],
  ["explÃƒÂ­citas", "explícitas"],
  ["ExplÃƒÂ­citas", "Explícitas"],
  ["InferÃƒÂªncia", "Inferência"],
  ["inferÃƒÂªncia", "inferência"],
  ["ProduÃƒÂ§ÃƒÂ£o", "Produção"],
  ["produÃƒÂ§ÃƒÂ£o", "produção"],
  ["atenÃƒÂ§ÃƒÂ£o", "atenção"],
  ["AtenÃƒÂ§ÃƒÂ£o", "Atenção"],
  ["LÃƒÂ­ngua", "Língua"],
  ["lÃƒÂ­ngua", "língua"],
  ["perÃƒÂ­odos", "períodos"],
  ["PerÃƒÂ­odos", "Períodos"],
  ["Ã‚Âº", "º"],
  ["ÃƒÂ§", "ç"],
  ["ÃƒÂ£", "ã"],
  ["ÃƒÂµ", "õ"],
  ["ÃƒÂª", "ê"],
  ["ÃƒÂ­", "í"],
  ["ÃƒÂ¡", "á"],
  ["ÃƒÂ©", "é"],
  ["ÃƒÂ³", "ó"],
  ["ÃƒÂº", "ú"],
  ["ÃƒÂ‡", "Ç"],
  ["ÃƒÂ", "Á"],
  ["Ã‚", ""],
];

if (fileExists(materialPath)) {
  backup(materialPath);
  const before = read(materialPath);
  const after = replaceAll(before, encodingPairs);

  if (after !== before) {
    write(materialPath, after);
    console.log(`OK: encoding corrigido em ${materialPath}`);
  } else {
    console.log(`OK: ${materialPath} não tinha as ocorrências conhecidas.`);
  }
} else {
  console.log(`AVISO: arquivo não encontrado: ${materialPath}`);
}

const possibleUiFiles = [
  "src/lib/navigation.ts",
  "src/components/PageShell.tsx",
  "src/app/page.tsx",
  "src/app/HomeClient.tsx",
  "src/components/HomeClient.tsx",
];

for (const relativePath of possibleUiFiles) {
  if (!fileExists(relativePath)) {
    continue;
  }

  backup(relativePath);
  const before = read(relativePath);

  // Troca apenas o nome visual "Gemini" por "IA".
  // Não altera GEMINI_API_KEY, nomes de env ou imports internos.
  const after = before.replace(/\bGemini\b/g, "IA");

  if (after !== before) {
    write(relativePath, after);
    console.log(`OK: referência visual a Gemini substituída por IA em ${relativePath}`);
  } else {
    console.log(`OK: nenhuma referência visual a Gemini em ${relativePath}`);
  }
}

console.log("");
console.log("Polimento concluído.");
