/**
 * Verificação completa — modelos DOCX personalizados da escola.
 * Run: npm run verify:custom-template-docx
 */
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = join(root, "tmp", "verify-custom-template-final");
const moduleCache = new Map();

function loadTsModule(relativePath) {
  const normalized = relativePath.replace(/\\/g, "/");
  if (moduleCache.has(normalized)) return moduleCache.get(normalized);

  const ts = require("typescript");
  const sourcePath = join(root, relativePath);
  const source = readFileSync(sourcePath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: sourcePath,
  }).outputText;

  const module = { exports: {} };
  const localRequire = (specifier) => {
    if (specifier.startsWith(".")) {
      const resolved = join(dirname(sourcePath), specifier);
      for (const candidate of [`${resolved}.ts`, `${resolved}.js`]) {
        if (candidate.endsWith(".ts")) {
          const rel = candidate.slice(root.length + 1).replace(/\\/g, "/");
          return loadTsModule(rel);
        }
      }
    }
    return require(specifier);
  };

  const evaluator = new Function(
    "exports",
    "require",
    "module",
    "__dirname",
    "__filename",
    transpiled,
  );
  evaluator(module.exports, localRequire, module, dirname(sourcePath), sourcePath);
  moduleCache.set(normalized, module.exports);
  return module.exports;
}

function buildPayload(tipo, trimestre = 1) {
  const habilidades = [
    { codigo: "EF05HI01", descricao: "Identificar processos de formação das culturas." },
    { codigo: "EF05HI02", descricao: "Identificar mecanismos de organização do poder." },
  ];
  const conteudos =
    tipo === "anual"
      ? ["Povos originários", "Colonização", "Independência"]
      : ["Povos originários", "Colonização"];
  const matrix = conteudos.map((conteudo, index) => ({
    conteudo,
    trimestre,
    aulaInicio: index * 2 + 1,
    aulaFim: index * 2 + 2,
    habilidades: [habilidades[index % habilidades.length]],
    objetivos: `Compreender ${conteudo.toLowerCase()}.`,
    metodologia: "Aula dialogada.",
    recursos: "Livro didático.",
    avaliacao: "Participação.",
    evidencias: "Registros.",
  }));

  return {
    tipoPlanejamento: tipo,
    escola: "Escola Verificação Planify",
    professor: "Prof. Verificação",
    etapa: "Ensino Fundamental",
    anoSerie: "5º ano",
    componenteCurricular: "História",
    cargaHoraria: "60 aulas",
    trimestre: String(trimestre),
    conteudos,
    matrizPlanejamento: {
      tipoPlanejamento: tipo,
      titulo: `Verificação ${tipo}`,
      resumo: "verify",
      conteudos: matrix,
    },
  };
}

function assertDocx(label, buffer, minBytes = 1000) {
  assert.ok(Buffer.isBuffer(buffer), `${label}: buffer inválido`);
  assert.ok(buffer.byteLength >= minBytes, `${label}: DOCX pequeno (${buffer.byteLength})`);
  assert.equal(buffer.subarray(0, 2).toString("utf8"), "PK", `${label}: não é ZIP`);
}

function buildMinimalDocx(documentXml) {
  function crc32(buf) {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
    let crc = 0xffffffff;
    for (const byte of buf) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }
  function u16(v) {
    const b = Buffer.alloc(2);
    b.writeUInt16LE(v, 0);
    return b;
  }
  function u32(v) {
    const b = Buffer.alloc(4);
    b.writeUInt32LE(v >>> 0, 0);
    return b;
  }

  const contentTypes = `<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`;
  const rels = `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;
  const files = [
    ["[Content_Types].xml", contentTypes],
    ["_rels/.rels", rels],
    ["word/document.xml", documentXml],
  ];
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  for (const [filePath, content] of files) {
    const fileName = Buffer.from(filePath, "utf8");
    const buf = Buffer.from(content, "utf8");
    const checksum = crc32(buf);
    const localHeader = Buffer.concat([
      u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(checksum), u32(buf.length), u32(buf.length), u16(fileName.length), u16(0), fileName,
    ]);
    localParts.push(localHeader, buf);
    centralParts.push(
      Buffer.concat([
        u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0),
        u32(checksum), u32(buf.length), u32(buf.length), u16(fileName.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), fileName,
      ]),
    );
    offset += localHeader.length + buf.length;
  }
  const centralDirectory = Buffer.concat(centralParts);
  const localData = Buffer.concat(localParts);
  return Buffer.concat([
    localData,
    centralDirectory,
    Buffer.concat([u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length), u32(centralDirectory.length), u32(localData.length), u16(0)]),
  ]);
}

function main() {
  const { buildOfficialPlanningDocx } = loadTsModule("src/server/planejamentos/official-planning-docx.ts");
  const { buildPlanningDocx } = loadTsModule("src/server/planejamentos/planning-docx-service.ts");
  const { buildUniversalPlanningDocx, tryFillUniversalTemplate } = loadTsModule(
    "src/server/planejamentos/universal-planning-docx.ts",
  );
  const { CUSTOM_TEMPLATE_FALLBACK_MESSAGE } = loadTsModule(
    "src/server/planejamentos/planning-docx-constants.ts",
  );

  mkdirSync(outputDir, { recursive: true });
  const checks = [];

  // 1. Motor oficial inalterado
  const officialAnual = buildOfficialPlanningDocx(buildPayload("anual"));
  const officialTrim = buildOfficialPlanningDocx(buildPayload("trimestral", 1));
  assertDocx("official-anual", officialAnual, 500000);
  assertDocx("official-trimestral", officialTrim, 400000);
  checks.push({ name: "official-anual", ok: true, bytes: officialAnual.byteLength });
  checks.push({ name: "official-trimestral", ok: true, bytes: officialTrim.byteLength });

  // 2. Sem template → oficial via service
  const defaultViaService = buildPlanningDocx(buildPayload("anual"));
  assert.equal(defaultViaService.templateSource, "official");
  assert.equal(defaultViaService.usedFallback, false);
  assertDocx("service-default", defaultViaService.buffer, 500000);
  checks.push({ name: "service-default", ok: true, source: defaultViaService.templateSource });

  // 3. Placeholders + labels
  const placeholderXml = `<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>
    <w:tbl>
      <w:tr><w:tc><w:p><w:r><w:t>Escola</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t> </w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:p><w:r><w:t>Habilidades BNCC</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t> </w:t></w:r></w:p></w:tc></w:tr>
    </w:tbl>
    <w:p><w:r><w:t>{{ESCOLA}} {{HABILIDADES}}</w:t></w:r></w:p>
  </w:body></w:document>`;
  const fill = tryFillUniversalTemplate(placeholderXml, buildPayload("anual"));
  assert.equal(fill.success, true);
  assert.ok(fill.stats.placeholdersReplaced >= 2);
  assert.ok(fill.stats.labelFills >= 1);
  checks.push({ name: "placeholders-labels", ok: true, stats: fill.stats });

  // 4. Custom template real
  const schoolTemplate = readFileSync(join(root, "data", "modelos-oficiais", "modelo-anual.docx"));
  const custom = buildPlanningDocx(buildPayload("anual"), schoolTemplate);
  assert.equal(custom.templateSource, "custom");
  assert.equal(custom.usedFallback, false);
  assertDocx("custom-school", custom.buffer, 10000);
  checks.push({ name: "custom-school", ok: true, bytes: custom.buffer.byteLength });

  // 5. Fallback
  const emptyDocx = buildMinimalDocx(
    `<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>vazio</w:t></w:r></w:p></w:body></w:document>`,
  );
  const fallback = buildPlanningDocx(buildPayload("anual"), emptyDocx);
  assert.equal(fallback.templateSource, "official");
  assert.equal(fallback.usedFallback, true);
  assert.equal(fallback.fallbackMessage, CUSTOM_TEMPLATE_FALLBACK_MESSAGE);
  assertDocx("fallback", fallback.buffer, 500000);
  checks.push({ name: "fallback", ok: true, message: fallback.fallbackMessage });

  writeFileSync(join(outputDir, "official-anual.docx"), officialAnual);
  writeFileSync(join(outputDir, "custom-school.docx"), custom.buffer);
  writeFileSync(join(outputDir, "fallback.docx"), fallback.buffer);

  console.log("verify-custom-template-docx: CHECKLIST");
  for (const check of checks) {
    console.log(`  ✓ ${check.name}`, JSON.stringify(check));
  }
}

main();
console.log("verify-custom-template-docx: OK");
