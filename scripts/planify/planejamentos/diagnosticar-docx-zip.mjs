import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const require = createRequire(import.meta.url);

function countZipEntries(buffer) {
  let eocd = -1;
  for (let i = buffer.length - 22; i >= 0; i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) return { valid: false, total: 0 };
  const total = buffer.readUInt16LE(eocd + 10);
  const central = buffer.readUInt32LE(eocd + 16);
  let p = central;
  const methods = {};
  for (let i = 0; i < total; i++) {
    const method = buffer.readUInt16LE(p + 10);
    methods[method] = (methods[method] || 0) + 1;
    const fnLen = buffer.readUInt16LE(p + 28);
    const exLen = buffer.readUInt16LE(p + 30);
    const cmLen = buffer.readUInt16LE(p + 32);
    p += 46 + fnLen + exLen + cmLen;
  }
  return { valid: true, total, bytes: buffer.length, methods };
}

function loadTsModule(relativePath) {
  const ts = require("typescript");
  const sourcePath = path.join(root, relativePath);
  const source = fs.readFileSync(sourcePath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    fileName: sourcePath,
  }).outputText;
  const module = { exports: {} };
  const localRequire = (specifier) => {
    if (specifier.startsWith(".")) {
      const resolved = path.join(path.dirname(sourcePath), specifier);
      for (const candidate of [`${resolved}.ts`, `${resolved}.js`]) {
        if (candidate.endsWith(".ts")) {
          const rel = candidate.slice(root.length + 1).replace(/\\/g, "/");
          return loadTsModule(rel);
        }
      }
    }
    return require(specifier);
  };
  new Function("exports", "require", "module", "__dirname", "__filename", transpiled)(
    module.exports, localRequire, module, path.dirname(sourcePath), sourcePath,
  );
  return module.exports;
}

const template = fs.readFileSync(path.join(root, "data", "modelos-oficiais", "modelo-anual.docx"));
const { buildOfficialPlanningDocx } = loadTsModule("src/server/planejamentos/official-planning-docx.ts");
const { buildUniversalPlanningDocx } = loadTsModule("src/server/planejamentos/universal-planning-docx.ts");
const { buildPlanningDocx } = loadTsModule("src/server/planejamentos/planning-docx-service.ts");

const payload = {
  tipoPlanejamento: "anual",
  escola: "Escola Teste",
  professor: "Prof Teste",
  etapa: "EF",
  anoSerie: "5º ano",
  componenteCurricular: "História",
  cargaHoraria: "60",
  trimestre: "1",
  conteudos: ["Povos originários", "Colonização", "Independência"],
  matrizPlanejamento: {
    tipoPlanejamento: "anual",
    titulo: "Teste",
    resumo: "x",
    conteudos: [
      { conteudo: "Povos originários", trimestre: 1, aulaInicio: 1, aulaFim: 10, habilidades: [{ codigo: "EF05HI01", descricao: "Skill A" }], objetivos: "O1", metodologia: "M1", recursos: "R1", avaliacao: "A1", evidencias: "E1" },
      { conteudo: "Colonização", trimestre: 1, aulaInicio: 11, aulaFim: 20, habilidades: [{ codigo: "EF05HI02", descricao: "Skill B" }], objetivos: "O2", metodologia: "M2", recursos: "R2", avaliacao: "A2", evidencias: "E2" },
      { conteudo: "Independência", trimestre: 2, aulaInicio: 21, aulaFim: 30, habilidades: [{ codigo: "EF05HI03", descricao: "Skill C" }], objetivos: "O3", metodologia: "M3", recursos: "R3", avaliacao: "A3", evidencias: "E3" },
    ],
  },
};

const official = buildOfficialPlanningDocx(payload);
const custom = buildPlanningDocx(payload, template);
const universal = buildUniversalPlanningDocx(template, payload);

const report = {
  template: countZipEntries(template),
  official: countZipEntries(official),
  custom: countZipEntries(custom.buffer),
  universal: countZipEntries(universal.buffer),
};

console.log("ZIP_DIAGNOSTIC", JSON.stringify(report, null, 2));

// Check skills per row in document xml (rough)
const { readZip } = (() => {
  const { inflateRawSync } = require("zlib");
  function readZip(buffer) {
    let eocdOffset = -1;
    for (let index = buffer.length - 22; index >= 0; index -= 1) {
      if (buffer.readUInt32LE(index) === 0x06054b50) { eocdOffset = index; break; }
    }
    const totalEntries = buffer.readUInt16LE(eocdOffset + 10);
    const centralOffset = buffer.readUInt32LE(eocdOffset + 16);
    const entries = new Map();
    let pointer = centralOffset;
    for (let index = 0; index < totalEntries; index += 1) {
      const compression = buffer.readUInt16LE(pointer + 10);
      const compressedSize = buffer.readUInt32LE(pointer + 20);
      const fileNameLength = buffer.readUInt16LE(pointer + 28);
      const extraLength = buffer.readUInt16LE(pointer + 30);
      const commentLength = buffer.readUInt16LE(pointer + 32);
      const localHeaderOffset = buffer.readUInt32LE(pointer + 42);
      const fileName = buffer.subarray(pointer + 46, pointer + 46 + fileNameLength).toString("utf8");
      const localNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
      const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
      const dataStart = localHeaderOffset + 30 + localNameLength + localExtraLength;
      const compressedData = buffer.subarray(dataStart, dataStart + compressedSize);
      if (compression === 0) entries.set(fileName, Buffer.from(compressedData));
      else if (compression === 8) entries.set(fileName, inflateRawSync(compressedData));
      pointer += 46 + fileNameLength + extraLength + commentLength;
    }
    return entries;
  }
  return { readZip };
})();

const xml = readZip(official).get("word/document.xml")?.toString("utf8") || "";
const skillHits = ["EF05HI01", "EF05HI02", "EF05HI03"].map((code) => ({
  code,
  count: (xml.match(new RegExp(code, "g")) || []).length,
}));
console.log("SKILL_HITS_OFFICIAL", JSON.stringify(skillHits));
