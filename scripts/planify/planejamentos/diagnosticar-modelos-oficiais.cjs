const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

const root = process.cwd();

function readZip(buffer) {
  let eocd = -1;
  for (let i = buffer.length - 22; i >= 0; i -= 1) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("ZIP inválido");

  const total = buffer.readUInt16LE(eocd + 10);
  let pointer = buffer.readUInt32LE(eocd + 16);
  const entries = new Map();

  for (let i = 0; i < total; i += 1) {
    const compression = buffer.readUInt16LE(pointer + 10);
    const size = buffer.readUInt32LE(pointer + 20);
    const nameLen = buffer.readUInt16LE(pointer + 28);
    const extraLen = buffer.readUInt16LE(pointer + 30);
    const commentLen = buffer.readUInt16LE(pointer + 32);
    const local = buffer.readUInt32LE(pointer + 42);
    const name = buffer.subarray(pointer + 46, pointer + 46 + nameLen).toString("utf8");

    const localNameLen = buffer.readUInt16LE(local + 26);
    const localExtraLen = buffer.readUInt16LE(local + 28);
    const dataStart = local + 30 + localNameLen + localExtraLen;
    const compressed = buffer.subarray(dataStart, dataStart + size);
    const data = compression === 8 ? zlib.inflateRawSync(compressed) : Buffer.from(compressed);

    entries.set(name, data);
    pointer += 46 + nameLen + extraLen + commentLen;
  }

  return entries;
}

function textFromXml(xml) {
  return xml
    .replace(/<w:tab\/>/g, " ")
    .replace(/<w:br\/>/g, "\n")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .trim();
}

function cellTexts(rowXml) {
  const cells = rowXml.match(/<w:tc[\s\S]*?<\/w:tc>/g) || [];
  return cells.map((cell) => textFromXml(cell).replace(/\s+/g, " ").trim());
}

function inspect(file) {
  const entries = readZip(fs.readFileSync(file));
  const documentXml = entries.get("word/document.xml")?.toString("utf8");
  if (!documentXml) throw new Error("word/document.xml não encontrado");

  const tables = documentXml.match(/<w:tbl[\s\S]*?<\/w:tbl>/g) || [];
  const paragraphs = documentXml.match(/<w:p[\s\S]*?<\/w:p>/g) || [];

  const report = [];
  report.push(`# Diagnóstico: ${path.relative(root, file)}`);
  report.push("");
  report.push(`- Tabelas: ${tables.length}`);
  report.push(`- Parágrafos: ${paragraphs.length}`);
  report.push(`- Headers: ${Array.from(entries.keys()).filter((k) => k.startsWith("word/header")).length}`);
  report.push(`- Footers: ${Array.from(entries.keys()).filter((k) => k.startsWith("word/footer")).length}`);
  report.push(`- Imagens: ${Array.from(entries.keys()).filter((k) => k.startsWith("word/media/")).length}`);
  report.push("");

  tables.forEach((table, tableIndex) => {
    const rows = table.match(/<w:tr[\s\S]*?<\/w:tr>/g) || [];
    const counts = rows.map((row) => cellTexts(row).length);
    report.push(`## Tabela ${tableIndex + 1}`);
    report.push(`- Linhas: ${rows.length}`);
    report.push(`- Células por linha: ${counts.join(", ") || "0"}`);
    report.push("");

    rows.slice(0, 8).forEach((row, rowIndex) => {
      const cells = cellTexts(row);
      report.push(`Linha ${rowIndex + 1}:`);
      cells.forEach((cell, cellIndex) => {
        report.push(`- C${cellIndex + 1}: ${cell.slice(0, 180) || "(vazio)"}`);
      });
      report.push("");
    });
  });

  return report.join("\n");
}

const modelDir = path.join(root, "data", "modelos-oficiais");
const files = [
  path.join(modelDir, "modelo-anual.docx"),
  path.join(modelDir, "modelo-trimestral.docx"),
];

const outDir = path.join(root, "tmp");
fs.mkdirSync(outDir, { recursive: true });

const parts = ["# Diagnóstico dos modelos oficiais Planify", ""];

for (const file of files) {
  if (!fs.existsSync(file)) {
    parts.push(`ERRO: não encontrado: ${path.relative(root, file)}`);
    continue;
  }

  parts.push(inspect(file));
  parts.push("");
}

const output = path.join(outDir, "diagnostico-modelos-oficiais.md");
fs.writeFileSync(output, parts.join("\n"), "utf8");

console.log("");
console.log("Diagnóstico gerado:");
console.log(output);
console.log("");
console.log("Abra esse arquivo se precisar conferir a estrutura real das tabelas.");
