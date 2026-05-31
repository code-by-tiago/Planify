const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function write(relativePath, content) {
  fs.writeFileSync(path.join(root, relativePath), content, "utf8");
}

function backup(relativePath) {
  const full = path.join(root, relativePath);
  const bak = `${full}.bak-9-13-docx-real`;

  if (fs.existsSync(full)) {
    fs.copyFileSync(full, bak);
  }
}

function addImport(text, importLine, afterLinePattern) {
  if (text.includes(importLine)) {
    return text;
  }

  const match = text.match(afterLinePattern);

  if (!match) {
    return `${importLine}\n${text}`;
  }

  return text.replace(match[0], `${match[0]}\n${importLine}`);
}

function removeDocumentDownloadImport(text) {
  return text
    .split(/\r?\n/)
    .filter((line) => !line.includes('from "../../lib/downloads/document-download"'))
    .join("\n");
}

function replaceFunction(text, functionName, replacement) {
  const marker = `function ${functionName}`;
  const start = text.indexOf(marker);

  if (start === -1) {
    return text;
  }

  const open = text.indexOf("{", start);

  if (open === -1) {
    return text;
  }

  let depth = 0;
  let end = -1;

  for (let index = open; index < text.length; index += 1) {
    const char = text[index];

    if (char === "{") {
      depth += 1;
    }

    if (char === "}") {
      depth -= 1;

      if (depth === 0) {
        end = index + 1;
        break;
      }
    }
  }

  if (end === -1) {
    return text;
  }

  return `${text.slice(0, start)}${replacement}${text.slice(end)}`;
}

function patchMateriais() {
  const file = "src/app/materiais/MateriaisClient.tsx";

  if (!fs.existsSync(path.join(root, file))) {
    console.log(`Ignorado: ${file}`);
    return;
  }

  backup(file);

  let text = read(file);
  text = removeDocumentDownloadImport(text);
  text = addImport(
    text,
    'import { downloadDocxDocument } from "../../lib/downloads/docx-download-client";',
    /import Link from "next\/link";/,
  );

  const downloadFunction = `async function downloadDocument(material: GeneratedMaterial) {
  await downloadDocxDocument(
    "material",
    material,
    material.titulo || "material-planify",
  );
}`;

  if (text.includes("function downloadJSON(")) {
    text = replaceFunction(text, "downloadJSON", downloadFunction);
  }

  if (text.includes("function downloadDocument(")) {
    text = replaceFunction(text, "downloadDocument", downloadFunction);
  } else {
    text = text.replace(
      "export function MateriaisClient()",
      `${downloadFunction}\n\nexport function MateriaisClient()`,
    );
  }

  text = text.replaceAll("downloadJSON(generatedMaterial)", "downloadDocument(generatedMaterial)");
  text = text.replaceAll("downloadGeneratedMaterialDocument(material);", 'await downloadDocxDocument("material", material, material.titulo || "material-planify");');
  text = text.replaceAll("Baixar JSON", "Baixar DOCX");
  text = text.replaceAll("Baixar documento", "Baixar DOCX");

  write(file, text);
  console.log(`Ajustado: ${file}`);
}

function patchBiblioteca() {
  const file = "src/app/biblioteca/BibliotecaClient.tsx";

  if (!fs.existsSync(path.join(root, file))) {
    console.log(`Ignorado: ${file}`);
    return;
  }

  backup(file);

  let text = read(file);
  text = removeDocumentDownloadImport(text);
  text = addImport(
    text,
    'import { downloadDocxDocument } from "../../lib/downloads/docx-download-client";',
    /"use client";/,
  );

  const downloadFunction = `async function downloadItem(item: BibliotecaItem) {
  await downloadDocxDocument("biblioteca", item, item.title);
}`;

  if (text.includes("function downloadItem(")) {
    text = replaceFunction(text, "downloadItem", downloadFunction);
  } else {
    text = text.replace(
      "export function BibliotecaClient()",
      `${downloadFunction}\n\nexport function BibliotecaClient()`,
    );
  }

  text = text.replaceAll("Baixar JSON", "Baixar DOCX");
  text = text.replaceAll("Baixar documento", "Baixar DOCX");
  text = text.replaceAll("Baixar material", "Baixar DOCX");

  write(file, text);
  console.log(`Ajustado: ${file}`);
}

function patchMarketplace() {
  const file = "src/app/marketplace/MarketplaceClient.tsx";

  if (!fs.existsSync(path.join(root, file))) {
    console.log(`Ignorado: ${file}`);
    return;
  }

  backup(file);

  let text = read(file);
  text = removeDocumentDownloadImport(text);
  text = addImport(
    text,
    'import { downloadDocxDocument } from "../../lib/downloads/docx-download-client";',
    /import Link from "next\/link";/,
  );

  const downloadFunction = `async function downloadItem(item: MarketplaceItem) {
  const updated = {
    ...item,
    downloads: item.downloads + 1,
  };

  const stored = getStoredItems().map((current) =>
    current.id === item.id ? updated : current,
  );

  setStoredItems(stored);
  await downloadDocxDocument("marketplace", updated, updated.title);
}`;

  if (text.includes("function downloadItem(")) {
    text = replaceFunction(text, "downloadItem", downloadFunction);
  } else {
    text = text.replace(
      "function saveItem",
      `${downloadFunction}\n\nfunction saveItem`,
    );
  }

  text = text.replaceAll("Baixar JSON", "Baixar DOCX");
  text = text.replaceAll("Baixar documento", "Baixar DOCX");
  text = text.replaceAll("Baixar material", "Baixar DOCX");

  write(file, text);
  console.log(`Ajustado: ${file}`);
}

patchMateriais();
patchBiblioteca();
patchMarketplace();

console.log("");
console.log("Planify 9.13 | Patches DOCX real aplicados.");
