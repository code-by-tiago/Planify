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
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function inspect(file) {
  const entries = readZip(fs.readFileSync(file));
  const xml = entries.get("word/document.xml")?.toString("utf8");
  if (!xml) throw new Error("document.xml ausente");

  const tables = xml.match(/<w:tbl[\s\S]*?<\/w:tbl>/g) || [];
  const report = [];
  report.push(`# ${path.relative(root, file)}`);
  report.push(`Tabelas: ${tables.length}`);
  report.push("");

  tables.forEach((table, tableIndex) => {
    const rows = table.match(/<w:tr[\s\S]*?<\/w:tr>/g) || [];
    report.push(`## Tabela ${tableIndex + 1}`);
    report.push(`Linhas: ${rows.length}`);
    rows.slice(0, 10).forEach((row, rowIndex) => {
      const cells = row.match(/<w:tc[\s\S]*?<\/w:tc>/g) || [];
      report.push(`Linha ${rowIndex + 1} / células ${cells.length}`);
      cells.forEach((cell, cellIndex) => {
        report.push(`- C${cellIndex + 1}: ${textFromXml(cell).replace(/\s+/g, " ").slice(0, 220)}`);
      });
    });
    report.push("");
  });

  return report.join("\n");
}

const dir = path.join(root, "data", "modelos-oficiais");
const output = path.join(root, "tmp", "diagnostico-preenchimento-template.md");
fs.mkdirSync(path.dirname(output), { recursive: true });

const files = [
  path.join(dir, "modelo-anual.docx"),
  path.join(dir, "modelo-trimestral.docx"),
];

const report = ["# Diagnóstico de preenchimento fiel do template", ""];
for (const file of files) {
  if (fs.existsSync(file)) {
    report.push(inspect(file));
  } else {
    report.push(`ERRO: ausente ${file}`);
  }
}

fs.writeFileSync(output, report.join("\n"), "utf8");
console.log("Diagnóstico gerado:");
console.log(output);
