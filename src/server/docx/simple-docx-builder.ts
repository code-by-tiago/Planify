import { buildNativeDocumentBodyXml } from "./html-to-native-docx";

type Primitive = string | number | boolean | null | undefined;

export type DocxSection = {
  title: string;
  content?: Primitive;
  items?: Primitive[];
};

export type DocxDocumentSpec = {
  title: string;
  subtitle?: Primitive;
  badge?: Primitive;
  metadata?: Record<string, Primitive>;
  sections?: DocxSection[];
  filename?: string;
};

type ZipFileEntry = {
  path: string;
  content: string | Buffer;
};

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);

  for (let n = 0; n < 256; n += 1) {
    let c = n;

    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }

    table[n] = c >>> 0;
  }

  return table;
})();

function crc32(input: Buffer): number {
  let crc = 0xffffffff;

  for (const byte of input) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function u16(value: number): Buffer {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt16LE(value & 0xffff, 0);
  return buffer;
}

function u32(value: number): Buffer {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32LE(value >>> 0, 0);
  return buffer;
}

function getDosDateTime(date = new Date()) {
  const year = Math.max(date.getFullYear(), 1980);
  const dosTime =
    (date.getHours() << 11) |
    (date.getMinutes() << 5) |
    Math.floor(date.getSeconds() / 2);
  const dosDate =
    ((year - 1980) << 9) |
    ((date.getMonth() + 1) << 5) |
    date.getDate();

  return {
    time: dosTime,
    date: dosDate,
  };
}

function buildZip(files: ZipFileEntry[]): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;
  const now = getDosDateTime();

  for (const file of files) {
    const fileName = Buffer.from(file.path.replace(/\\/g, "/"), "utf8");
    const content = Buffer.isBuffer(file.content)
      ? file.content
      : Buffer.from(file.content, "utf8");
    const checksum = crc32(content);

    const localHeader = Buffer.concat([
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(0),
      u16(now.time),
      u16(now.date),
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
      u16(now.time),
      u16(now.date),
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
  const endRecord = Buffer.concat([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(files.length),
    u16(files.length),
    u32(centralDirectory.length),
    u32(localData.length),
    u16(0),
  ]);

  return Buffer.concat([localData, centralDirectory, endRecord]);
}

function escapeXml(value: Primitive): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function cleanText(value: Primitive): string {
  return String(value ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

function textRuns(value: Primitive) {
  const lines = cleanText(value).split("\n");

  return lines
    .map((line, index) => {
      const escaped = escapeXml(line);
      const text = `<w:t xml:space="preserve">${escaped}</w:t>`;

      if (index === 0) {
        return text;
      }

      return `<w:br/>${text}`;
    })
    .join("");
}

function paragraph(value: Primitive, style?: string) {
  const text = cleanText(value);

  if (!text) {
    return "";
  }

  const styleXml = style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : "";

  return `<w:p>${styleXml}<w:r>${style === "Title" ? "<w:rPr><w:b/><w:sz w:val=\"48\"/></w:rPr>" : ""}${textRuns(text)}</w:r></w:p>`;
}

function bullet(value: Primitive) {
  const text = cleanText(value);

  if (!text) {
    return "";
  }

  return `<w:p>
    <w:pPr>
      <w:pStyle w:val="ListParagraph"/>
      <w:ind w:left="720"/>
    </w:pPr>
    <w:r><w:t xml:space="preserve">• ${escapeXml(text)}</w:t></w:r>
  </w:p>`;
}

function metadataTable(metadata?: Record<string, Primitive>) {
  const entries = Object.entries(metadata || {}).filter(([, value]) => {
    return value !== null && value !== undefined && cleanText(value).length > 0;
  });

  if (entries.length === 0) {
    return "";
  }

  const rows = entries
    .map(([key, value]) => {
      return `<w:tr>
        <w:tc>
          <w:tcPr><w:tcW w:w="2800" w:type="dxa"/><w:shd w:fill="E2E8F0"/></w:tcPr>
          <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>${escapeXml(key)}</w:t></w:r></w:p>
        </w:tc>
        <w:tc>
          <w:tcPr><w:tcW w:w="6200" w:type="dxa"/></w:tcPr>
          <w:p><w:r><w:t xml:space="preserve">${escapeXml(value)}</w:t></w:r></w:p>
        </w:tc>
      </w:tr>`;
    })
    .join("");

  return `<w:tbl>
    <w:tblPr>
      <w:tblW w:w="9000" w:type="dxa"/>
      <w:tblBorders>
        <w:top w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
        <w:left w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
        <w:bottom w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
        <w:right w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
        <w:insideH w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
        <w:insideV w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
      </w:tblBorders>
    </w:tblPr>
    ${rows}
  </w:tbl>`;
}

function sectionXml(section: DocxSection) {
  const content = cleanText(section.content);
  const items = (section.items || [])
    .map((item) => cleanText(item))
    .filter(Boolean);

  return [
    paragraph(section.title, "Heading1"),
    content ? paragraph(content) : "",
    ...items.map((item) => bullet(item)),
  ].join("");
}

function documentXml(spec: DocxDocumentSpec) {
  const title = cleanText(spec.title) || "Documento Planify";
  const subtitle = cleanText(spec.subtitle);
  const badge = cleanText(spec.badge) || "Planify";

  const body = [
    paragraph(badge.toUpperCase(), "Badge"),
    paragraph(title, "Title"),
    subtitle ? paragraph(subtitle, "Subtitle") : "",
    paragraph(`Gerado em ${new Date().toLocaleDateString("pt-BR")}`, "Small"),
    metadataTable(spec.metadata),
    ...(spec.sections || []).map(sectionXml),
  ].join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    ${body}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
      <w:cols w:space="720"/>
      <w:docGrid w:linePitch="360"/>
    </w:sectPr>
  </w:body>
</w:document>`;
}

function stylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
    <w:pPr><w:spacing w:after="160" w:line="276" w:lineRule="auto"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="22"/><w:color w:val="111827"/></w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="Title">
    <w:name w:val="Title"/>
    <w:basedOn w:val="Normal"/>
    <w:qFormat/>
    <w:pPr><w:spacing w:before="160" w:after="220"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:b/><w:sz w:val="46"/><w:color w:val="0F172A"/></w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="Subtitle">
    <w:name w:val="Subtitle"/>
    <w:basedOn w:val="Normal"/>
    <w:qFormat/>
    <w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="24"/><w:color w:val="475569"/></w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="Badge">
    <w:name w:val="Badge"/>
    <w:basedOn w:val="Normal"/>
    <w:qFormat/>
    <w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:b/><w:sz w:val="18"/><w:color w:val="0F766E"/></w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="Small">
    <w:name w:val="Small"/>
    <w:basedOn w:val="Normal"/>
    <w:qFormat/>
    <w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="18"/><w:color w:val="64748B"/></w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:qFormat/>
    <w:pPr><w:spacing w:before="360" w:after="160"/><w:keepNext/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:b/><w:sz w:val="30"/><w:color w:val="0F766E"/></w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="ListParagraph">
    <w:name w:val="List Paragraph"/>
    <w:basedOn w:val="Normal"/>
    <w:qFormat/>
    <w:pPr><w:spacing w:after="100"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="22"/><w:color w:val="334155"/></w:rPr>
  </w:style>
</w:styles>`;
}

function contentTypesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`;
}

function rootRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;
}

function documentRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
}

function corePropsXml(title: string) {
  const now = new Date().toISOString();

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties
  xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:dcterms="http://purl.org/dc/terms/"
  xmlns:dcmitype="http://purl.org/dc/dcmitype/"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>${escapeXml(title)}</dc:title>
  <dc:creator>Planify</dc:creator>
  <cp:lastModifiedBy>Planify</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified>
</cp:coreProperties>`;
}

function appPropsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties
  xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"
  xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Planify</Application>
</Properties>`;
}

function altChunkContentTypesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="htm" ContentType="text/html"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`;
}

function altChunkDocumentXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    <w:altChunk r:id="rId1"/>
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
      <w:cols w:space="720"/>
      <w:docGrid w:linePitch="360"/>
    </w:sectPr>
  </w:body>
</w:document>`;
}

function altChunkDocumentRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/aFChunk" Target="afchunk.htm"/>
</Relationships>`;
}

export function buildNativeHtmlDocx(params: {
  title: string;
  htmlBody: string;
}): Buffer {
  const title = cleanText(params.title) || "Documento Planify";

  return buildZip([
    {
      path: "[Content_Types].xml",
      content: contentTypesXml(),
    },
    {
      path: "_rels/.rels",
      content: rootRelsXml(),
    },
    {
      path: "word/document.xml",
      content: buildNativeDocumentBodyXml(title, params.htmlBody),
    },
    {
      path: "word/_rels/document.xml.rels",
      content: documentRelsXml(),
    },
    {
      path: "word/styles.xml",
      content: stylesXml(),
    },
    {
      path: "docProps/core.xml",
      content: corePropsXml(title),
    },
    {
      path: "docProps/app.xml",
      content: appPropsXml(),
    },
  ]);
}

/** @deprecated altChunk abre em branco no Word com HTML complexo — use buildNativeHtmlDocx */
export function buildHtmlAltChunkDocx(params: {
  title: string;
  htmlDocument: string;
}): Buffer {
  const title = cleanText(params.title) || "Documento Planify";

  return buildZip([
    {
      path: "[Content_Types].xml",
      content: altChunkContentTypesXml(),
    },
    {
      path: "_rels/.rels",
      content: rootRelsXml(),
    },
    {
      path: "word/document.xml",
      content: altChunkDocumentXml(),
    },
    {
      path: "word/_rels/document.xml.rels",
      content: altChunkDocumentRelsXml(),
    },
    {
      path: "word/afchunk.htm",
      content: params.htmlDocument,
    },
    {
      path: "docProps/core.xml",
      content: corePropsXml(title),
    },
    {
      path: "docProps/app.xml",
      content: appPropsXml(),
    },
  ]);
}

export function buildSimpleDocx(spec: DocxDocumentSpec): Buffer {
  const title = cleanText(spec.title) || "Documento Planify";

  return buildZip([
    {
      path: "[Content_Types].xml",
      content: contentTypesXml(),
    },
    {
      path: "_rels/.rels",
      content: rootRelsXml(),
    },
    {
      path: "word/document.xml",
      content: documentXml(spec),
    },
    {
      path: "word/_rels/document.xml.rels",
      content: documentRelsXml(),
    },
    {
      path: "word/styles.xml",
      content: stylesXml(),
    },
    {
      path: "docProps/core.xml",
      content: corePropsXml(title),
    },
    {
      path: "docProps/app.xml",
      content: appPropsXml(),
    },
  ]);
}
