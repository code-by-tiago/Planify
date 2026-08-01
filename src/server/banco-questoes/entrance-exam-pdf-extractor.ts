import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { PNG } from "pngjs";
import { computeQuestionContentHash } from "@/lib/banco-questoes/question-bank-hash";
import type {
  EntranceExamExtractedQuestion,
  EntranceExamExtractionConfig,
  EntranceExamExtractionReport,
  EntranceExamExtractionResult,
  EntranceExamImageAsset,
  EntranceExamQuestionType,
} from "@/types/entrance-exam-extractor";
import type { QuestionBankItem } from "@/types/question-bank";

type PdfJsModule = typeof import("pdfjs-dist/legacy/build/pdf.mjs");

type PdfTextItem = {
  str?: string;
  transform?: number[];
  width?: number;
  height?: number;
};

type PdfLine = {
  text: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  pageWidth: number;
  pageHeight: number;
  column: number;
};

type QuestionSegment = {
  number: string;
  numericNumber: number;
  lines: PdfLine[];
  supportSeed?: string;
};

type ImageCandidate = EntranceExamImageAsset & {
  fileName: string;
};

type ExtractEntranceExamPdfInput = {
  pdfBuffer: Buffer;
  fileName: string;
  config?: EntranceExamExtractionConfig;
  assetBaseDir?: string;
  assetPublicPath?: string;
};

const requireFromHere = createRequire(import.meta.url);

const DEFAULT_SUPPORT_MARKERS = [
  "texto para",
  "leia o texto",
  "leia a tirinha",
  "observe a imagem",
  "observe o grafico",
  "observe o mapa",
  "observe a tabela",
  "com base no texto",
  "a partir do texto",
  "para responder",
];

const DEFAULT_IGNORE_LINE_PATTERNS = [
  "^\\s*[-–—]?\\s*\\d+\\s*[-–—]?\\s*$",
  "^\\s*pagina\\s+\\d+\\s*$",
  "^\\s*page\\s+\\d+\\s*$",
];

const COMMAND_LINE_PATTERN =
  /^(?:assinale|marque|indique|responda|explique|calcule|determine|identifique|justifique|cite|qual|quais|quem|o que|por que|considerando|com base|de acordo|a partir|em relacao|em rela[cç][aã]o)\b/i;

const INSTRUCTIONAL_PATTERNS = [
  /caderno de quest/i,
  /cart[aã]o[- ]resposta/i,
  /folha de reda/i,
  /leia atentamente as instru/i,
  /transcreva no espa/i,
  /aplicador da sala/i,
  /tempo dispon[ií]vel/i,
  /rascunhos e as marca/i,
  /somente ser[aã]o corrigidas/i,
  /confira se a quantidade/i,
  /ordem das quest/i,
  /\bfiscal\b/i,
  /\bcandidato/i,
  /dura[cç][aã]o da prova/i,
  /biosseguran[cç]a/i,
  /preencha a folha/i,
  /folha de respostas/i,
  /vedad[ao]s?\b/i,
  /material de consulta/i,
  /aparelhos de telecomunica/i,
  /retirar-se da sala/i,
  /procedimentos adicionais de identifica/i,
  /controle do processo/i,
  /quest[oõ]es objetivas.*alternativas/i,
  /quest[aã]o objetiva admite/i,
  /interpreta[cç][aã]o das quest[oõ]es faz parte/i,
  /caneta|l[aá]pis|borracha|r[eé]gua|compasso|transferidor/i,
  /instru/i,
  /cart.*respost/i,
  /preenchimento.*respost/i,
  /tempo .*prova/i,
  /tempo suplementar/i,
  /local de exame/i,
  /deixar o local/i,
  /nao .*permitido/i,
  /permitido deixar/i,
  /folhas.*caderno/i,
  /esta prova .*composta/i,
  /cada uma das quest.*objetivas/i,
  /alternativas.*correta/i,
  /submeter.*respostas/i,
  /enviar.*respostas/i,
  /site de provas/i,
  /leia os enunciados/i,
  /horas de prova/i,
  /ser[aã]o anuladas/i,
  /contagem de pontos/i,
  /quest.*cinco alternativas/i,
  /espa[cç]os em branco.*rascunho/i,
  /aguarde autoriza/i,
  /abrir o caderno/i,
  /numera[cç][aã]o de todas as p/i,
  /prova desta fase.*composta/i,
  /somente uma deve ser assinalada/i,
  /aplicadores de prova/i,
];

function slugify(value: string): string {
  return String(value || "pdf")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 80) || "pdf";
}

function normalizeText(value: string): string {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeForSearch(value: string): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

function compileIgnorePatterns(config?: EntranceExamExtractionConfig): RegExp[] {
  return [...DEFAULT_IGNORE_LINE_PATTERNS, ...(config?.ignoreLinePatterns ?? [])]
    .map((source) => {
      try {
        return new RegExp(source, "i");
      } catch {
        return null;
      }
    })
    .filter((pattern): pattern is RegExp => Boolean(pattern));
}

function isIgnoredLine(text: string, patterns: RegExp[]): boolean {
  const normalized = normalizeForSearch(text);
  return patterns.some((pattern) => pattern.test(normalized));
}

function getQuestionStart(
  text: string,
  previousNumber: number | null,
  config?: EntranceExamExtractionConfig,
): { number: string; numericNumber: number; rest: string } | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  if (config?.questionPattern) {
    try {
      const custom = new RegExp(config.questionPattern, "i");
      const match = trimmed.match(custom);
      const value = match?.[1] ?? match?.[0];
      const numericNumber = Number.parseInt(String(value || ""), 10);
      if (Number.isFinite(numericNumber)) {
        return {
          number: String(value).padStart(String(value).length <= 2 ? 2 : 1, "0"),
          numericNumber,
          rest: match?.[2]?.trim() ?? "",
        };
      }
    } catch {
      // Fall back to defaults below.
    }
  }

  const questaoMatch = trimmed.match(
    /^(?:quest(?:[aã]o|ion)?\s*)?(\d{1,3})(?:\s*[.)\-–:]\s*|\s+)(.*)$/i,
  );
  if (!questaoMatch) return null;

  const hasQuestionLabel = /^quest/i.test(trimmed);
  const numericNumber = Number.parseInt(questaoMatch[1], 10);
  const rest = questaoMatch[2]?.trim() ?? "";

  if (!Number.isFinite(numericNumber) || numericNumber < 1 || numericNumber > 300) {
    return null;
  }

  if (!hasQuestionLabel && rest.length < 8) return null;

  if (previousNumber !== null) {
    const nextLooksSequential =
      numericNumber > previousNumber && numericNumber <= previousNumber + 8;
    const restartLooksIntentional = numericNumber === 1 && hasQuestionLabel;
    if (!nextLooksSequential && !restartLooksIntentional) return null;
  }

  return {
    number: questaoMatch[1],
    numericNumber,
    rest,
  };
}

function getAlternativeStart(
  text: string,
  config?: EntranceExamExtractionConfig,
): { label: string; text: string } | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  if (config?.alternativePattern) {
    try {
      const custom = new RegExp(config.alternativePattern, "i");
      const match = trimmed.match(custom);
      if (match) {
        return {
          label: String(match[1] || "").toUpperCase(),
          text: String(match[2] || match[0]).trim(),
        };
      }
    } catch {
      // Fall back to defaults below.
    }
  }

  const match = trimmed.match(/^(?:\(?([A-Ea-e])\)|([A-Ea-e])[.)])\s+(.+)$/);
  if (!match) return null;

  return {
    label: String(match[1] || match[2]).toUpperCase(),
    text: match[3].trim(),
  };
}

function multiplyMatrix(a: number[], b: number[]): number[] {
  return [
    a[0] * b[0] + a[2] * b[1],
    a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3],
    a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4],
    a[1] * b[4] + a[3] * b[5] + a[5],
  ];
}

function transformPoint(matrix: number[], x: number, y: number): [number, number] {
  return [
    matrix[0] * x + matrix[2] * y + matrix[4],
    matrix[1] * x + matrix[3] * y + matrix[5],
  ];
}

function matrixToTopLeftBox(
  matrix: number[],
  pageHeight: number,
): { x: number; y: number; width: number; height: number } {
  const points = [
    transformPoint(matrix, 0, 0),
    transformPoint(matrix, 1, 0),
    transformPoint(matrix, 0, 1),
    transformPoint(matrix, 1, 1),
  ];
  const xs = points.map((point) => point[0]);
  const ys = points.map((point) => point[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    x: minX,
    y: pageHeight - maxY,
    width: Math.max(0, maxX - minX),
    height: Math.max(0, maxY - minY),
  };
}

function imageDataToRgba(image: {
  width?: number;
  height?: number;
  data?: Uint8ClampedArray | Uint8Array | Buffer;
}): Buffer | null {
  const width = Number(image.width || 0);
  const height = Number(image.height || 0);
  const data = image.data ? Buffer.from(image.data) : null;
  if (!width || !height || !data) return null;

  const pixelCount = width * height;
  if (data.length === pixelCount * 4) return data;

  const rgba = Buffer.alloc(pixelCount * 4);
  if (data.length === pixelCount * 3) {
    for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
      rgba[j] = data[i];
      rgba[j + 1] = data[i + 1];
      rgba[j + 2] = data[i + 2];
      rgba[j + 3] = 255;
    }
    return rgba;
  }

  if (data.length === pixelCount) {
    for (let i = 0, j = 0; i < data.length; i += 1, j += 4) {
      rgba[j] = data[i];
      rgba[j + 1] = data[i];
      rgba[j + 2] = data[i];
      rgba[j + 3] = 255;
    }
    return rgba;
  }

  return null;
}

async function getPdfObject(page: unknown, objectId: string): Promise<unknown> {
  const objs = (page as { objs?: { get?: (...args: unknown[]) => unknown } }).objs;
  const getObject = objs?.get;
  if (!objs || !getObject) return null;

  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: unknown) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    try {
      const value = getObject.call(objs, objectId, finish);
      if (value) finish(value);
      setTimeout(() => finish(null), 250);
    } catch {
      finish(null);
    }
  });
}

async function writeImageAsset(input: {
  image: unknown;
  assetDir: string;
  assetPublicPath: string;
  pageNumber: number;
  index: number;
  box: { x: number; y: number; width: number; height: number };
}): Promise<ImageCandidate | null> {
  const image = input.image as {
    width?: number;
    height?: number;
    data?: Uint8ClampedArray | Uint8Array | Buffer;
  } | null;

  if (!image?.width || !image.height) return null;
  const rgba = imageDataToRgba(image);
  if (!rgba) return null;

  await mkdir(input.assetDir, { recursive: true });

  const png = new PNG({ width: image.width, height: image.height });
  rgba.copy(png.data);
  const fileName = `page-${input.pageNumber}-image-${input.index}.png`;
  const filePath = path.join(input.assetDir, fileName);
  const encoded = PNG.sync.write(png);
  await writeFile(filePath, encoded);

  const publicPath = input.assetPublicPath.replace(/\/$/, "");
  return {
    url: `${publicPath}/${fileName}`,
    fileName,
    page: input.pageNumber,
    x: Math.round(input.box.x),
    y: Math.round(input.box.y),
    width: Math.round(input.box.width),
    height: Math.round(input.box.height),
  };
}

async function extractPageImages(input: {
  pdfjs: PdfJsModule;
  page: unknown;
  pageNumber: number;
  pageHeight: number;
  assetDir?: string;
  assetPublicPath?: string;
}): Promise<ImageCandidate[]> {
  if (!input.assetDir || !input.assetPublicPath) return [];

  const page = input.page as {
    getOperatorList?: () => Promise<{ fnArray: number[]; argsArray: unknown[][] }>;
  };
  if (!page.getOperatorList) return [];

  const operatorList = await page.getOperatorList().catch(() => null);
  if (!operatorList) return [];

  const OPS = input.pdfjs.OPS as Record<string, number>;
  const paintOps = new Set([
    OPS.paintImageXObject,
    OPS.paintJpegXObject,
    OPS.paintInlineImageXObject,
    OPS.paintImageMaskXObject,
  ]);

  const stack: number[][] = [];
  let matrix = [1, 0, 0, 1, 0, 0];
  const images: ImageCandidate[] = [];

  for (let index = 0; index < operatorList.fnArray.length; index += 1) {
    const fn = operatorList.fnArray[index];
    const args = operatorList.argsArray[index] || [];

    if (fn === OPS.save) {
      stack.push([...matrix]);
      continue;
    }
    if (fn === OPS.restore) {
      matrix = stack.pop() || [1, 0, 0, 1, 0, 0];
      continue;
    }
    if (fn === OPS.transform && args.length >= 6) {
      matrix = multiplyMatrix(matrix, args.slice(0, 6).map(Number));
      continue;
    }

    if (!paintOps.has(fn)) continue;

    const box = matrixToTopLeftBox(matrix, input.pageHeight);
    if (box.width < 12 || box.height < 12) continue;

    const rawImage =
      fn === OPS.paintInlineImageXObject || fn === OPS.paintImageMaskXObject
        ? args[0]
        : typeof args[0] === "string"
          ? await getPdfObject(input.page, args[0])
          : null;

    const asset = await writeImageAsset({
      image: rawImage,
      assetDir: input.assetDir,
      assetPublicPath: input.assetPublicPath,
      pageNumber: input.pageNumber,
      index: images.length + 1,
      box,
    }).catch(() => null);

    if (asset) images.push(asset);
  }

  return images;
}

function getTextLineFromItems(
  items: PdfTextItem[],
  page: number,
  pageWidth: number,
  pageHeight: number,
  ignorePatterns: RegExp[],
): PdfLine[] {
  const textItems = items
    .map((item) => {
      const text = normalizeText(item.str || "");
      const transform = item.transform || [1, 0, 0, 1, 0, 0];
      const height = Math.max(1, Math.abs(Number(item.height || transform[3] || 1)));
      const width = Math.max(1, Number(item.width || 1));
      return {
        text,
        x: Number(transform[4] || 0),
        y: pageHeight - Number(transform[5] || 0),
        width,
        height,
      };
    })
    .filter((item) => item.text && !isIgnoredLine(item.text, ignorePatterns))
    .sort((a, b) => a.y - b.y || a.x - b.x);

  const lines: PdfLine[] = [];
  const yTolerance = 4;

  for (const item of textItems) {
    const last = lines[lines.length - 1];
    if (last && Math.abs(last.y - item.y) <= yTolerance) {
      const gap = item.x - (last.x + last.width);
      last.text = `${last.text}${gap > 3 ? " " : ""}${item.text}`;
      last.width = Math.max(last.width, item.x + item.width - last.x);
      last.height = Math.max(last.height, item.height);
      continue;
    }

    lines.push({
      text: item.text,
      page,
      x: item.x,
      y: item.y,
      width: item.width,
      height: item.height,
      pageWidth,
      pageHeight,
      column: 0,
    });
  }

  return lines;
}

function detectColumnCount(lines: PdfLine[], pageWidth: number, config?: EntranceExamExtractionConfig): 1 | 2 {
  if (config?.columns === 1 || config?.columns === 2) return config.columns;

  const contentLines = lines.filter(
    (line) => line.text.length > 8 && line.width < pageWidth * 0.72,
  );
  const left = contentLines.filter((line) => line.x < pageWidth * 0.42).length;
  const right = contentLines.filter((line) => line.x > pageWidth * 0.45).length;

  return left >= 8 && right >= 8 ? 2 : 1;
}

function assignColumns(lines: PdfLine[], config?: EntranceExamExtractionConfig): PdfLine[] {
  const byPage = new Map<number, PdfLine[]>();
  for (const line of lines) {
    byPage.set(line.page, [...(byPage.get(line.page) || []), line]);
  }

  const output: PdfLine[] = [];
  for (const pageLines of byPage.values()) {
    const pageWidth = pageLines[0]?.pageWidth || 0;
    const columns = detectColumnCount(pageLines, pageWidth, config);
    for (const line of pageLines) {
      output.push({
        ...line,
        column: columns === 2 && line.x > pageWidth * 0.48 ? 1 : 0,
      });
    }
  }

  return output.sort((a, b) => a.page - b.page || a.column - b.column || a.y - b.y || a.x - b.x);
}

function lineHasSupportMarker(line: string, config?: EntranceExamExtractionConfig): boolean {
  const markers = [...DEFAULT_SUPPORT_MARKERS, ...(config?.supportTextMarkers ?? [])];
  const normalized = normalizeForSearch(line);
  return markers.some((marker) => normalized.includes(normalizeForSearch(marker)));
}

function segmentQuestions(lines: PdfLine[], config?: EntranceExamExtractionConfig): QuestionSegment[] {
  const segments: QuestionSegment[] = [];
  const floatingSupport: PdfLine[] = [];
  let current: QuestionSegment | null = null;
  let previousNumber: number | null = null;

  for (const line of lines) {
    const start = getQuestionStart(line.text, previousNumber, config);
    if (start) {
      if (current) segments.push(current);

      const supportSeed = floatingSupport.length
        ? normalizeText(floatingSupport.map((supportLine) => supportLine.text).join("\n"))
        : undefined;
      floatingSupport.length = 0;

      const firstLine = start.rest
        ? { ...line, text: start.rest }
        : { ...line, text: "" };

      current = {
        number: start.number,
        numericNumber: start.numericNumber,
        lines: firstLine.text ? [firstLine] : [],
        supportSeed,
      };
      previousNumber = start.numericNumber;
      continue;
    }

    if (current) {
      current.lines.push(line);
    } else if (line.text.length > 20) {
      floatingSupport.push(line);
      if (floatingSupport.length > 18) floatingSupport.shift();
    }
  }

  if (current) segments.push(current);
  return segments.filter((segment) => segment.lines.length > 0);
}

function extractAlternatives(
  lines: string[],
  config?: EntranceExamExtractionConfig,
): { bodyLines: string[]; alternatives: string[] } {
  const bodyLines: string[] = [];
  const alternatives: string[] = [];
  let currentAlternative = -1;

  for (const line of lines) {
    const alt = getAlternativeStart(line, config);
    if (alt) {
      alternatives.push(alt.text);
      currentAlternative = alternatives.length - 1;
      continue;
    }

    if (currentAlternative >= 0 && !COMMAND_LINE_PATTERN.test(line)) {
      alternatives[currentAlternative] = normalizeText(
        `${alternatives[currentAlternative]} ${line}`,
      );
      continue;
    }

    bodyLines.push(line);
  }

  if (alternatives.length === 0) {
    const joined = lines.join(" ");
    const matches = Array.from(
      joined.matchAll(/(?:^|\s)(?:\(?([A-Ea-e])\)|([A-Ea-e])[.)])\s+(.+?)(?=\s+(?:\(?[A-Ea-e]\)|[A-Ea-e][.)])\s+|$)/g),
    );
    if (matches.length >= 2) {
      return {
        bodyLines: [
          normalizeText(joined.slice(0, matches[0].index ?? 0)),
        ].filter(Boolean),
        alternatives: matches.map((match) => normalizeText(match[3] || "")),
      };
    }
  }

  return { bodyLines, alternatives };
}

function splitSupportAndStatement(
  lines: string[],
  supportSeed?: string,
  config?: EntranceExamExtractionConfig,
): { statement: string; supportText?: string } {
  const body = lines.map(normalizeText).filter(Boolean);
  if (!body.length) {
    return {
      statement: "",
      supportText: supportSeed,
    };
  }

  const commandIndex = body.findIndex((line, index) => {
    if (index === 0) return false;
    return COMMAND_LINE_PATTERN.test(normalizeForSearch(line));
  });

  let supportText = supportSeed ? normalizeText(supportSeed) : "";
  let statementLines = body;

  if (commandIndex > 0) {
    const candidateSupport = body.slice(0, commandIndex);
    const candidateStatement = body.slice(commandIndex);
    const supportChars = candidateSupport.join(" ").length;
    const hasMarker = candidateSupport.some((line) => lineHasSupportMarker(line, config));

    if (supportChars >= 220 || hasMarker || supportSeed) {
      supportText = normalizeText(
        [supportText, candidateSupport.join("\n")].filter(Boolean).join("\n\n"),
      );
      statementLines = candidateStatement;
    }
  }

  const statement = normalizeText(statementLines.join("\n"));
  return {
    statement,
    supportText: supportText || undefined,
  };
}

function getSegmentBounds(segment: QuestionSegment): Map<number, { x1: number; y1: number; x2: number; y2: number }> {
  const bounds = new Map<number, { x1: number; y1: number; x2: number; y2: number }>();

  for (const line of segment.lines) {
    const current = bounds.get(line.page) || {
      x1: Number.POSITIVE_INFINITY,
      y1: Number.POSITIVE_INFINITY,
      x2: 0,
      y2: 0,
    };
    current.x1 = Math.min(current.x1, line.x);
    current.y1 = Math.min(current.y1, line.y);
    current.x2 = Math.max(current.x2, line.x + line.width);
    current.y2 = Math.max(current.y2, line.y + line.height);
    bounds.set(line.page, current);
  }

  return bounds;
}

function associateImages(segment: QuestionSegment, images: ImageCandidate[]): EntranceExamImageAsset[] {
  const byPageBounds = getSegmentBounds(segment);
  const associated: EntranceExamImageAsset[] = [];

  for (const image of images) {
    const bounds = byPageBounds.get(image.page);
    if (!bounds) continue;

    const imageCenterX = image.x + image.width / 2;
    const imageCenterY = image.y + image.height / 2;
    const horizontalOverlap = imageCenterX >= bounds.x1 - 40 && imageCenterX <= bounds.x2 + 80;
    const verticalNear = imageCenterY >= bounds.y1 - 30 && imageCenterY <= bounds.y2 + 180;

    if (horizontalOverlap && verticalNear) {
      associated.push({
        url: image.url,
        page: image.page,
        x: image.x,
        y: image.y,
        width: image.width,
        height: image.height,
      });
    }
  }

  return associated;
}

function segmentToQuestion(
  segment: QuestionSegment,
  images: ImageCandidate[],
  fileName: string,
  config?: EntranceExamExtractionConfig,
): EntranceExamExtractedQuestion {
  const rawLines = segment.lines.map((line) => line.text).map(normalizeText).filter(Boolean);
  const { bodyLines, alternatives } = extractAlternatives(rawLines, config);
  const { statement, supportText } = splitSupportAndStatement(
    bodyLines,
    segment.supportSeed,
    config,
  );
  const imageAssets = associateImages(segment, images);
  const pages = segment.lines.map((line) => line.page);
  const questionType: EntranceExamQuestionType =
    alternatives.length >= 2 ? "MultipleChoice" : "OpenQuestion";

  return {
    question_number: segment.number,
    question_type: questionType,
    statement,
    alternatives,
    image: imageAssets[0]?.url ?? null,
    images: imageAssets,
    support_text: supportText,
    source_pdf: fileName,
    page_start: Math.min(...pages),
    page_end: Math.max(...pages),
  };
}

function shouldKeepQuestion(question: EntranceExamExtractedQuestion): boolean {
  if (question.statement.length < 8) return false;

  const searchable = normalizeForSearch(
    `${question.statement}\n${question.support_text || ""}`,
  );
  if (INSTRUCTIONAL_PATTERNS.some((pattern) => pattern.test(searchable))) {
    return false;
  }

  const looksLikeOpenPrompt =
    COMMAND_LINE_PATTERN.test(normalizeForSearch(question.statement)) ||
    /[?]$/.test(question.statement.trim()) ||
    /\b(?:mostre|prove|resolva|obtenha|escreva|demonstre)\b/i.test(
      normalizeForSearch(question.statement),
    );

  if (question.question_type === "OpenQuestion") return looksLikeOpenPrompt;

  return true;
}

function mapQuestionToBankItem(
  question: EntranceExamExtractedQuestion,
  config: EntranceExamExtractionConfig | undefined,
  createdAt: string,
): QuestionBankItem {
  const tipo = question.question_type === "MultipleChoice" ? "objetiva" : "discursiva";
  const enunciado = normalizeText(question.statement);
  const tema = config?.tema?.trim() || question.source_pdf.replace(/\.pdf$/i, "");
  const idSeed = `${question.source_pdf}:${question.question_number}:${enunciado}`;
  const id = `qb-pdf-${createHash("sha1").update(idSeed).digest("hex").slice(0, 16)}`;

  return {
    id,
    enunciado,
    textoApoio: question.support_text,
    imageUrls: question.images.map((image) => image.url),
    tipo,
    alternativas: question.alternatives,
    respostaEsperada: "",
    criterioCorrecao: "",
    componente: config?.componente || "Multicomponente",
    anoSerie: config?.anoSerie || "Geral",
    etapa: config?.etapa || "ENEM e Vestibulares",
    tema,
    bnccCodigos: [],
    tags: [
      "extracao-pdf",
      "vestibular",
      `questao-${question.question_number}`,
      `pag-${question.page_start}`,
    ],
    sourceTitle: `${question.source_pdf} - questao ${question.question_number}`,
    sourceType: "pdf-vestibular",
    collection: "vestibular",
    reviewStatus: "pending",
    contentHash: computeQuestionContentHash(enunciado, tipo),
    createdAt,
    updatedAt: createdAt,
  };
}

function buildReport(input: {
  pdfName: string;
  pageCount: number;
  lines: PdfLine[];
  questions: EntranceExamExtractedQuestion[];
  images: ImageCandidate[];
  warnings: string[];
}): EntranceExamExtractionReport {
  const associatedImageCount = new Set(
    input.questions.flatMap((question) => question.images.map((image) => image.url)),
  ).size;

  return {
    pdfName: input.pdfName,
    pageCount: input.pageCount,
    textLineCount: input.lines.length,
    questionsFound: input.questions.length,
    multipleChoiceCount: input.questions.filter(
      (question) => question.question_type === "MultipleChoice",
    ).length,
    openQuestionCount: input.questions.filter(
      (question) => question.question_type === "OpenQuestion",
    ).length,
    imageCount: input.images.length,
    associatedImageCount,
    warnings: input.warnings,
  };
}

export async function extractEntranceExamPdf(
  input: ExtractEntranceExamPdfInput,
): Promise<EntranceExamExtractionResult> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(
    requireFromHere.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs"),
  ).toString();

  const warnings: string[] = [];
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(input.pdfBuffer),
    disableFontFace: true,
    disableWorker: true,
    useSystemFonts: true,
  } as unknown as Parameters<PdfJsModule["getDocument"]>[0]);
  const pdf = await loadingTask.promise;
  const pageLimit = input.config?.maxPages
    ? Math.min(pdf.numPages, Math.max(1, input.config.maxPages))
    : pdf.numPages;
  const ignorePatterns = compileIgnorePatterns(input.config);

  const fileSlug = slugify(input.fileName.replace(/\.pdf$/i, ""));
  const jobId = `${fileSlug}-${Date.now().toString(36)}`;
  const assetDir = input.assetBaseDir ? path.join(input.assetBaseDir, jobId) : undefined;
  const assetPublicPath = input.assetPublicPath
    ? `${input.assetPublicPath.replace(/\/$/, "")}/${jobId}`
    : undefined;

  const lines: PdfLine[] = [];
  const images: ImageCandidate[] = [];

  for (let pageNumber = 1; pageNumber <= pageLimit; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1 });
    const textContent = await page.getTextContent();
    const pageLines = getTextLineFromItems(
      textContent.items as PdfTextItem[],
      pageNumber,
      viewport.width,
      viewport.height,
      ignorePatterns,
    );
    lines.push(...pageLines);

    const pageImages = await extractPageImages({
      pdfjs,
      page,
      pageNumber,
      pageHeight: viewport.height,
      assetDir,
      assetPublicPath,
    });
    images.push(...pageImages);
  }

  if (lines.length === 0) {
    warnings.push(
      "Nenhuma linha de texto foi encontrada. O PDF pode ser escaneado e precisar de OCR.",
    );
  }

  const orderedLines = assignColumns(lines, input.config);
  const segments = segmentQuestions(orderedLines, input.config);
  const questions = segments
    .map((segment) => segmentToQuestion(segment, images, input.fileName, input.config))
    .filter(shouldKeepQuestion);

  if (segments.length === 0 && lines.length > 0) {
    warnings.push(
      "Nao foi possivel detectar numeracao de questoes. Ajuste questionPattern na configuracao.",
    );
  }
  if (images.length > 0 && questions.every((question) => question.images.length === 0)) {
    warnings.push(
      "Imagens foram extraidas, mas nenhuma ficou proxima o suficiente de uma questao.",
    );
  }

  const now = new Date().toISOString();
  const items = questions.map((question) => mapQuestionToBankItem(question, input.config, now));
  const report = buildReport({
    pdfName: input.fileName,
    pageCount: pageLimit,
    lines: orderedLines,
    questions,
    images,
    warnings,
  });

  return { questions, items, report };
}
