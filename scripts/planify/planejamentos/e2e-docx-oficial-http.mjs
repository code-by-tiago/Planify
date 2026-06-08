/**
 * E2E HTTP — POST /api/planejamentos/docx-oficial (JSON + multipart).
 * Uso: PLANIFY_E2E_EMAIL=... PLANIFY_E2E_PASSWORD=... node scripts/planify/planejamentos/e2e-docx-oficial-http.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const LOG_PATH = path.join(root, "debug-f33ae7.log");
const BASE_URL = process.env.PLANIFY_E2E_BASE_URL || "http://localhost:3000";

function auditLog(hypothesisId, location, message, data = {}) {
  fs.appendFileSync(
    LOG_PATH,
    `${JSON.stringify({
      sessionId: "f33ae7",
      runId: "e2e-http",
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    })}\n`,
  );
}

function loadEnv() {
  const envPath = path.join(root, ".env.local");
  const env = {};

  if (!fs.existsSync(envPath)) return env;

  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const idx = trimmed.indexOf("=");
    env[trimmed.slice(0, idx).trim()] = trimmed
      .slice(idx + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
  }

  return env;
}

function buildPayload(tipo = "anual") {
  const habilidades = [
    { codigo: "EF05HI01", descricao: "Identificar processos de formação das culturas." },
    { codigo: "EF05HI02", descricao: "Identificar mecanismos de organização do poder." },
  ];
  const conteudos = ["Povos originários", "Colonização"];
  const matrix = conteudos.map((conteudo, index) => ({
    conteudo,
    trimestre: 1,
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
    escola: "Escola E2E Planify",
    professor: "Prof. E2E",
    etapa: "Ensino Fundamental",
    anoSerie: "5º ano",
    componenteCurricular: "História",
    cargaHoraria: "60 aulas",
    trimestre: "1",
    conteudos,
    matrizPlanejamento: {
      tipoPlanejamento: tipo,
      titulo: "E2E",
      resumo: "e2e",
      conteudos: matrix,
    },
  };
}

function buildEmptyDocx() {
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body><w:p><w:r><w:t>Documento sem campos</w:t></w:r></w:p></w:body>
</w:document>`;
  const contentTypes = `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`;
  const rels = `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;

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
  function crc32(buf) {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
    let crc = 0xffffffff;
    for (const byte of buf) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 1);
    return (crc ^ 0xffffffff) >>> 0;
  }

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

async function signIn(env, email, password) {
  const response = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.access_token) {
    throw new Error(data?.error_description || data?.msg || "Falha no login Supabase.");
  }

  auditLog("H3", "e2e:signIn", "authenticated", { hasToken: true });
  return data.access_token;
}

async function postDocx(token, { jsonBody, templatePath, templateName }) {
  let response;

  if (templatePath) {
    const body = new FormData();
    body.set("payload", JSON.stringify(jsonBody));
    const blob = new Blob([fs.readFileSync(templatePath)], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    body.set("template", blob, templateName || path.basename(templatePath));

    response = await fetch(`${BASE_URL}/api/planejamentos/docx-oficial`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body,
    });
  } else {
    response = await fetch(`${BASE_URL}/api/planejamentos/docx-oficial`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(jsonBody),
    });
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return {
    ok: response.ok,
    status: response.status,
    bytes: buffer.length,
    templateSource: response.headers.get("X-Planify-Template-Source"),
    usedFallback: response.headers.get("X-Planify-Template-Fallback") === "true",
    fallbackMessage: response.headers.get("X-Planify-Template-Message"),
  };
}

async function main() {
  const env = loadEnv();
  const email = process.env.PLANIFY_E2E_EMAIL || process.argv[2];
  const password = process.env.PLANIFY_E2E_PASSWORD || process.argv[3];

  if (!email || !password) {
    throw new Error("Defina PLANIFY_E2E_EMAIL e PLANIFY_E2E_PASSWORD.");
  }

  const token = await signIn(env, email, password);
  const payload = buildPayload("anual");

  const defaultResult = await postDocx(token, { jsonBody: payload });
  auditLog("H6", "e2e:default", "json response", defaultResult);
  if (!defaultResult.ok || defaultResult.bytes < 10000) {
    throw new Error(`JSON default falhou: ${JSON.stringify(defaultResult)}`);
  }

  const schoolTemplate = path.join(root, "data", "modelos-oficiais", "modelo-anual.docx");
  const customResult = await postDocx(token, {
    jsonBody: payload,
    templatePath: schoolTemplate,
  });
  auditLog("H3", "e2e:custom", "multipart response", customResult);
  if (!customResult.ok || customResult.bytes < 10000) {
    throw new Error(`Multipart custom falhou: ${JSON.stringify(customResult)}`);
  }

  const emptyPath = path.join(root, "tmp", "e2e-unmapped.docx");
  fs.mkdirSync(path.dirname(emptyPath), { recursive: true });
  fs.writeFileSync(emptyPath, buildEmptyDocx());

  const fallbackResult = await postDocx(token, {
    jsonBody: payload,
    templatePath: emptyPath,
    templateName: "vazio.docx",
  });
  auditLog("H5", "e2e:fallback", "fallback response", fallbackResult);
  if (!fallbackResult.ok || !fallbackResult.usedFallback) {
    throw new Error(`Fallback esperado falhou: ${JSON.stringify(fallbackResult)}`);
  }

  auditLog("H4", "e2e:complete", "all http scenarios passed", {
    defaultBytes: defaultResult.bytes,
    customSource: customResult.templateSource,
    fallbackMessage: fallbackResult.fallbackMessage,
  });

  console.log("OK e2e-http", JSON.stringify({ defaultResult, customResult, fallbackResult }));
}

main().catch((error) => {
  auditLog("ERR", "e2e:main", "failed", { error: String(error) });
  console.error(error);
  process.exit(1);
});
