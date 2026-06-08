/**
 * Testes do motor de modelos DOCX da escola.
 * O aviso MODULE_TYPELESS_PACKAGE_JSON do Node é inofensivo (exit code 0).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

async function loadModule(relativePath) {
  const modulePath = path.join(root, relativePath);
  return import(pathToFileURL(modulePath).href);
}

function buildPayload(tipo, trimestre = 1) {
  const habilidades = [
    {
      codigo: "EF05HI01",
      descricao: "Identificar os processos de formação das culturas e dos povos.",
    },
    {
      codigo: "EF05HI02",
      descricao: "Identificar os mecanismos de organização do poder político.",
    },
  ];

  const conteudos =
    tipo === "anual"
      ? ["Povos originários do Brasil", "Chegada dos portugueses", "Colonização"]
      : ["Povos originários do Brasil", "Chegada dos portugueses"];

  const matrix = conteudos.map((conteudo, index) => ({
    conteudo,
    trimestre,
    aulaInicio: index * 2 + 1,
    aulaFim: index * 2 + 2,
    habilidades: [habilidades[index % habilidades.length]],
    objetivos: `Compreender ${conteudo.toLowerCase()}.`,
    metodologia: "Aula dialogada com leitura orientada e registros.",
    recursos: "Livro didático, quadro e caderno.",
    avaliacao: "Participação e produção escrita.",
    evidencias: "Registros e atividades concluídas.",
  }));

  return {
    tipoPlanejamento: tipo,
    escola: "Escola Teste Planify",
    professor: "Professor(a) Teste",
    etapa: "Ensino Fundamental",
    anoSerie: "5º ano",
    componenteCurricular: "História",
    cargaHoraria: "60 aulas",
    trimestre: String(trimestre),
    conteudos,
    matrizPlanejamento: {
      tipoPlanejamento: tipo,
      titulo: `Planejamento ${tipo}`,
      resumo: "Teste automatizado",
      conteudos: matrix,
    },
  };
}

async function main() {
  const { buildOfficialPlanningDocx } = await loadModule(
    "src/server/planejamentos/official-planning-docx.ts",
  );
  const { buildUniversalPlanningDocx } = await loadModule(
    "src/server/planejamentos/universal-planning-docx.ts",
  );

  function buildPlanningDocx(payload, customTemplate) {
    if (!customTemplate) {
      return {
        buffer: buildOfficialPlanningDocx(payload),
        usedFallback: false,
        templateSource: "official",
      };
    }

    try {
      const universal = buildUniversalPlanningDocx(customTemplate, payload);
      if (universal.success) {
        return {
          buffer: universal.buffer,
          usedFallback: false,
          templateSource: "custom",
        };
      }
    } catch {
      // fallback
    }

    return {
      buffer: buildOfficialPlanningDocx(payload),
      usedFallback: true,
      templateSource: "official",
      fallbackMessage:
        "Não foi possível mapear completamente este modelo. Usamos o modelo padrão do Planify para garantir o documento.",
    };
  }

  const outputDir = path.join(root, "tmp", "verify-custom-template");
  fs.mkdirSync(outputDir, { recursive: true });

  const anualTemplate = fs.readFileSync(
    path.join(root, "data", "modelos-oficiais", "modelo-anual.docx"),
  );
  const trimestralTemplate = fs.readFileSync(
    path.join(root, "data", "modelos-oficiais", "modelo-trimestral.docx"),
  );

  const scenarios = [
    {
      name: "default-anual",
      run: () => buildOfficialPlanningDocx(buildPayload("anual")),
    },
    {
      name: "default-trimestral",
      run: () => buildOfficialPlanningDocx(buildPayload("trimestral", 1)),
    },
    {
      name: "custom-anual-official-as-school",
      run: () =>
        buildPlanningDocx(buildPayload("anual"), anualTemplate).buffer,
    },
    {
      name: "custom-trimestral-official-as-school",
      run: () =>
        buildPlanningDocx(buildPayload("trimestral", 1), trimestralTemplate).buffer,
    },
  ];

  for (const scenario of scenarios) {
    const buffer = scenario.run();

    if (!buffer?.length) {
      throw new Error(`Cenário ${scenario.name} não gerou buffer.`);
    }

    const outputPath = path.join(outputDir, `${scenario.name}.docx`);
    fs.writeFileSync(outputPath, buffer);
    console.log(`OK ${scenario.name}: ${outputPath} (${buffer.length} bytes)`);
  }

  const emptyDocx = buildZipWithEmptyDocument();
  const fallbackResult = buildPlanningDocx(buildPayload("anual"), emptyDocx);

  if (!fallbackResult.usedFallback) {
    throw new Error("Esperava fallback para DOCX sem campos mapeáveis.");
  }

  console.log(`OK fallback-message: ${fallbackResult.fallbackMessage}`);

  const placeholderTemplate = buildPlaceholderDocx();
  const placeholderFill = buildUniversalPlanningDocx(
    placeholderTemplate,
    buildPayload("anual"),
  );

  if (!placeholderFill.success) {
    throw new Error("Esperava preenchimento por placeholders.");
  }

  const placeholderPath = path.join(outputDir, "placeholder-template-filled.docx");
  fs.writeFileSync(placeholderPath, placeholderFill.buffer);
  console.log(`OK placeholder-fill: ${placeholderPath}`);
}

function buildZipWithEmptyDocument() {
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body><w:p><w:r><w:t>Documento sem campos</w:t></w:r></w:p></w:body>
</w:document>`;

  return buildMinimalDocx(documentXml);
}

function buildPlaceholderDocx() {
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:tbl>
      <w:tr>
        <w:tc><w:p><w:r><w:t>Escola</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:p><w:r><w:t>Professor</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:p><w:r><w:t>Habilidades BNCC</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p></w:tc>
      </w:tr>
    </w:tbl>
    <w:p><w:r><w:t>{{ESCOLA}} - {{PROFESSOR}} - {{HABILIDADES}}</w:t></w:r></w:p>
  </w:body>
</w:document>`;

  return buildMinimalDocx(documentXml);
}

function crc32(input) {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }

  let crc = 0xffffffff;
  for (const byte of input) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function u16(value) {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt16LE(value & 0xffff, 0);
  return buffer;
}

function u32(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32LE(value >>> 0, 0);
  return buffer;
}

function buildMinimalDocx(documentXml) {
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const files = [
    { path: "[Content_Types].xml", content: contentTypes },
    { path: "_rels/.rels", content: rels },
    { path: "word/document.xml", content: documentXml },
  ];

  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const file of files) {
    const fileName = Buffer.from(file.path, "utf8");
    const content = Buffer.from(file.content, "utf8");
    const checksum = crc32(content);

    const localHeader = Buffer.concat([
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(checksum),
      u32(content.length),
      u32(content.length),
      u16(fileName.length),
      u16(0),
      fileName,
    ]);

    localParts.push(localHeader, content);

    const centralHeader = Buffer.concat([
      u32(0x02014b50),
      u16(20),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(checksum),
      u32(content.length),
      u32(content.length),
      u16(fileName.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      fileName,
    ]);

    centralParts.push(centralHeader);
    offset += localHeader.length + content.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const localData = Buffer.concat(localParts);

  return Buffer.concat([
    localData,
    centralDirectory,
    Buffer.concat([
      u32(0x06054b50),
      u16(0),
      u16(0),
      u16(files.length),
      u16(files.length),
      u32(centralDirectory.length),
      u32(localData.length),
      u16(0),
    ]),
  ]);
}

main().catch((error) => {
  console.error("Falha nos testes de modelo escola:", error);
  process.exit(1);
});
