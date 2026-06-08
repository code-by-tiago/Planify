/**
 * Auditoria cirúrgica — modelos DOCX personalizados (sem importar Next.js).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const LOG_PATH = path.join(root, "debug-f33ae7.log");

function auditLog(hypothesisId, location, message, data = {}) {
  const line = JSON.stringify({
    sessionId: "f33ae7",
    runId: "audit-script",
    hypothesisId,
    location,
    message,
    data,
    timestamp: Date.now(),
  });
  fs.appendFileSync(LOG_PATH, `${line}\n`);
}

async function loadModule(relativePath) {
  return import(pathToFileURL(path.join(root, relativePath)).href);
}

function buildPayload(tipo, trimestre = 1) {
  const habilidades = [
    { codigo: "EF05HI01", descricao: "Identificar os processos de formação das culturas." },
    { codigo: "EF05HI02", descricao: "Identificar os mecanismos de organização do poder." },
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
    metodologia: "Aula dialogada com leitura orientada.",
    recursos: "Livro didático e quadro.",
    avaliacao: "Participação e produção escrita.",
    evidencias: "Registros concluídos.",
  }));
  return {
    tipoPlanejamento: tipo,
    escola: "Escola Auditoria Planify",
    professor: "Prof. Auditoria",
    etapa: "Ensino Fundamental",
    anoSerie: "5º ano",
    componenteCurricular: "História",
    cargaHoraria: "60 aulas",
    trimestre: String(trimestre),
    conteudos,
    matrizPlanejamento: { tipoPlanejamento: tipo, titulo: `Audit ${tipo}`, resumo: "audit", conteudos: matrix },
  };
}

function buildMinimalDocx(documentXml) {
  const contentTypes = `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`;
  const rels = `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;
  return zipPack([
    ["[Content_Types].xml", contentTypes],
    ["_rels/.rels", rels],
    ["word/document.xml", documentXml],
  ]);
}

function crc32(input) {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (const byte of input) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function u16(v) {
  const b = Buffer.alloc(2);
  b.writeUInt16LE(v & 0xffff, 0);
  return b;
}
function u32(v) {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(v >>> 0, 0);
  return b;
}

function zipPack(files) {
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

function simulateBuildPlanningDocx(payload, customTemplate, buildOfficial, buildUniversal) {
  if (!customTemplate) {
    return { buffer: buildOfficial(payload), templateSource: "official", usedFallback: false };
  }
  try {
    const universal = buildUniversal(customTemplate, payload);
    if (universal.success) {
      return { buffer: universal.buffer, templateSource: "custom", usedFallback: false, stats: universal.stats };
    }
  } catch {
    // fallback
  }
  return {
    buffer: buildOfficial(payload),
    templateSource: "official",
    usedFallback: true,
    fallbackMessage:
      "Não foi possível mapear completamente este modelo. Usamos o modelo padrão do Planify para garantir o documento.",
  };
}

async function main() {
  const { buildOfficialPlanningDocx } = await loadModule("src/server/planejamentos/official-planning-docx.ts");
  const { buildUniversalPlanningDocx, tryFillUniversalTemplate } = await loadModule(
    "src/server/planejamentos/universal-planning-docx.ts",
  );

  const anualPath = path.join(root, "data", "modelos-oficiais", "modelo-anual.docx");
  const trimPath = path.join(root, "data", "modelos-oficiais", "modelo-trimestral.docx");
  const outDir = path.join(root, "tmp", "audit-custom-template");
  fs.mkdirSync(outDir, { recursive: true });

  const results = [];

  // H6 — modelo padrão inalterado
  const defaultAnual = buildOfficialPlanningDocx(buildPayload("anual"));
  const defaultTrim = buildOfficialPlanningDocx(buildPayload("trimestral", 1));
  results.push({ check: "default-anual", ok: defaultAnual.length > 500000, bytes: defaultAnual.length });
  results.push({ check: "default-trimestral", ok: defaultTrim.length > 400000, bytes: defaultTrim.length });
  auditLog("H6", "auditar:default", "official engine output", { anualBytes: defaultAnual.length, trimBytes: defaultTrim.length });

  // H4/H5 — placeholders e labels
  const placeholderXml = `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:tbl>
    <w:tr><w:tc><w:p><w:r><w:t>Escola</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t> </w:t></w:r></w:p></w:tc></w:tr>
    <w:tr><w:tc><w:p><w:r><w:t>Habilidades BNCC</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t> </w:t></w:r></w:p></w:tc></w:tr>
  </w:tbl><w:p><w:r><w:t>{{ESCOLA}} {{HABILIDADES}}</w:t></w:r></w:p></w:body></w:document>`;
  const placeholderDocx = buildMinimalDocx(placeholderXml);
  const fill = tryFillUniversalTemplate(
    placeholderXml,
    buildPayload("anual"),
  );
  results.push({
    check: "placeholders-and-labels",
    ok: fill.success && fill.stats.placeholdersReplaced >= 2 && fill.stats.labelFills >= 1,
    stats: fill.stats,
  });
  auditLog("H4", "auditar:placeholders", "universal fill stats", fill.stats);

  // H5 — fallback
  const emptyDocx = buildMinimalDocx(
    `<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Sem campos</w:t></w:r></w:p></w:body></w:document>`,
  );
  const fallback = simulateBuildPlanningDocx(
    buildPayload("anual"),
    emptyDocx,
    buildOfficialPlanningDocx,
    buildUniversalPlanningDocx,
  );
  results.push({
    check: "fallback-empty-template",
    ok: fallback.usedFallback && fallback.templateSource === "official",
    usedFallback: fallback.usedFallback,
    templateSource: fallback.templateSource,
    fallbackMessage: fallback.fallbackMessage,
    bytes: fallback.buffer?.length,
  });
  auditLog("H5", "auditar:fallback", "fallback result", { usedFallback: fallback.usedFallback, source: fallback.templateSource });

  // custom com template oficial como escola
  const anualTemplate = fs.readFileSync(anualPath);
  const customAnual = simulateBuildPlanningDocx(
    buildPayload("anual"),
    anualTemplate,
    buildOfficialPlanningDocx,
    buildUniversalPlanningDocx,
  );
  results.push({
    check: "custom-anual",
    ok: customAnual.buffer?.length > 10000,
    source: customAnual.templateSource,
    usedFallback: customAnual.usedFallback,
    bytes: customAnual.buffer?.length,
  });
  auditLog("H3", "auditar:custom-anual", "custom anual", {
    source: customAnual.templateSource,
    usedFallback: customAnual.usedFallback,
    bytes: customAnual.buffer?.length,
  });

  fs.writeFileSync(path.join(outDir, "audit-default-anual.docx"), defaultAnual);
  fs.writeFileSync(path.join(outDir, "audit-placeholder-filled.docx"), buildUniversalPlanningDocx(placeholderDocx, buildPayload("anual")).buffer);
  fs.writeFileSync(path.join(outDir, "audit-custom-anual.docx"), customAnual.buffer);

  const failed = results.filter((r) => !r.ok);
  console.log("AUDIT_RESULTS", JSON.stringify(results, null, 2));
  if (failed.length) {
    console.error("FALHAS:", failed.map((f) => f.check).join(", "));
    process.exit(1);
  }
  console.log("OK — auditoria programática concluída.");
}

main().catch((err) => {
  auditLog("ERR", "auditar:main", "script error", { error: String(err) });
  console.error(err);
  process.exit(1);
});
