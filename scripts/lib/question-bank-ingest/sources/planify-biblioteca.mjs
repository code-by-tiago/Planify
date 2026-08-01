/**
 * Fonte interna: pacotes curados scripts/data/biblioteca-seed-packages.mjs
 */
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  bumpReject,
  bumpSource,
  loadTsModule,
  normalizeWhitespace,
  validateQuestionCandidate,
} from "../shared.mjs";

const dataPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../data/biblioteca-seed-packages.mjs",
);

const { SEED_PACKAGES } = await import(pathToFileURL(dataPath).href);
const { isQuestionSelfContained } = loadTsModule(
  "src/lib/banco-questoes/question-bank-self-contained.ts",
);

export const SOURCE_ID = "planify-biblioteca";

const QUESTION_START = /^\s*(\d+)\)\s*/;
const TYPE_TAG = /^\(?(objetiva|discursiva|múltipla|multipla|desafio|verdadeiro ou falso)\)?\s*/i;
const ALT_LINE = /^\s*([a-dA-D])\)\s*(.+)$/;
const READING_SECTION = /texto (?:para )?leitura|texto de apoio|leitura\b/i;
const QUESTION_SECTION = /quest/i;

function parseGabaritoMap(items) {
  /** @type {Map<number, string>} */
  const map = new Map();
  for (const item of items) {
    const match = String(item).match(/^\s*(\d+)\)\s*(.+)$/s);
    if (!match) continue;
    map.set(Number(match[1]), normalizeWhitespace(match[2]));
  }
  return map;
}

function parseAlternativesFromText(text) {
  const lines = String(text).split(/\n+/);
  const alts = [];
  for (const line of lines) {
    const match = line.match(ALT_LINE);
    if (match) alts.push(normalizeWhitespace(match[2]));
  }
  if (alts.length >= 3) return alts;

  const inline = String(text).match(/([a-dA-D]\)\s*[^;\n]+)/g);
  if (!inline) return [];
  return inline.map((part) => normalizeWhitespace(part.replace(/^[a-dA-D]\)\s*/i, "")));
}

function resolveMcAnswer(enunciado, alternativas, gabarito) {
  const letterMatch = gabarito.match(/\bletra\s*([a-dA-D])\b/i);
  if (letterMatch && alternativas.length) {
    const idx = letterMatch[1].toLowerCase().charCodeAt(0) - "a".charCodeAt(0);
    if (alternativas[idx]) return alternativas[idx];
  }

  const directLetter = gabarito.match(/^([a-dA-D])\b/i);
  if (directLetter && alternativas.length) {
    const idx = directLetter[1].toLowerCase().charCodeAt(0) - "a".charCodeAt(0);
    if (alternativas[idx]) return alternativas[idx];
  }

  for (const alt of alternativas) {
    if (gabarito.toLowerCase().includes(alt.toLowerCase())) return alt;
  }

  return gabarito;
}

function extractQuestionsFromSectionItems(items, pkg, gabaritoMap, readingContext) {
  const results = [];

  for (const raw of items) {
    const text = String(raw).trim();
    const numMatch = text.match(QUESTION_START);
    if (!numMatch) continue;

    const num = Number(numMatch[1]);
    let body = text.replace(QUESTION_START, "").trim();
    const typeMatch = body.match(TYPE_TAG);
    const tipoTag = typeMatch?.[1]?.toLowerCase() || "";
    body = body.replace(TYPE_TAG, "").trim();

    const alternativas = parseAlternativesFromText(body);
    let enunciado = body;
    if (alternativas.length >= 3) {
      enunciado = body.split(/\n\s*[a-dA-D]\)/)[0].trim();
      enunciado = enunciado.replace(/\s+[a-dA-D]\)\s*.+$/s, "").trim();
    }
    enunciado = normalizeWhitespace(enunciado);
    const textoApoio = readingContext || undefined;

    const isMc =
      tipoTag.includes("objetiva") ||
      tipoTag.includes("multipla") ||
      tipoTag.includes("múltipla") ||
      alternativas.length >= 3;

    const gabaritoRaw = gabaritoMap.get(num) || "";
    if (!gabaritoRaw && !isMc && enunciado.length < 35) continue;

    const respostaEsperada = isMc
      ? resolveMcAnswer(enunciado, alternativas, gabaritoRaw || "Ver gabarito do pacote.")
      : gabaritoRaw || "Resposta discursiva — ver gabarito do pacote curado.";

    const selfCheck = isQuestionSelfContained(enunciado, textoApoio);
    if (!selfCheck.ok) continue;

    results.push({
      enunciado,
      textoApoio,
      tipo: isMc ? "multipla-escolha" : "discursiva",
      alternativas: alternativas.slice(0, 5),
      respostaEsperada,
      criterioCorrecao: gabaritoRaw || `Pacote: ${pkg.title}`,
      componente: pkg.componente || "Multicomponente",
      anoSerie: pkg.anoSerie || "Geral",
      etapa: pkg.etapa || "",
      tema: pkg.tema || pkg.title,
      bnccCodigos: pkg.habilidadesBncc || [],
      tags: [...(pkg.tags || []), "biblioteca", "curadoria"],
      sourceTitle: pkg.title,
      sourceType: "ingest:planify-biblioteca",
      authorName: "Planify Biblioteca OER",
    });
  }

  return results;
}

export async function* iteratePlanifyBiblioteca(ctx) {
  for (const pkg of SEED_PACKAGES) {
    if (ctx.shouldAbort()) return;

    const spec = typeof pkg.buildSpec === "function" ? pkg.buildSpec() : null;
    if (!spec?.sections) continue;

    let gabaritoMap = new Map();
    for (const section of spec.sections) {
      if (/gabarito/i.test(section.title || "") && Array.isArray(section.items)) {
        gabaritoMap = parseGabaritoMap(section.items);
      }
    }

    let activeReading = "";

    for (const section of spec.sections) {
      if (ctx.shouldAbort()) return;

      const title = section.title || "";

      if (READING_SECTION.test(title) && section.content) {
        activeReading = normalizeWhitespace(section.content);
        continue;
      }

      if (/gabarito|critério|rubrica|glossário/i.test(title)) continue;

      if (!Array.isArray(section.items) || !QUESTION_SECTION.test(title)) continue;

      bumpSource(ctx.stats, SOURCE_ID, "scanned");
      ctx.stats.scanned += section.items.length;

      const candidates = extractQuestionsFromSectionItems(
        section.items,
        pkg,
        gabaritoMap,
        activeReading,
      );

      for (const candidate of candidates) {
        const validation = validateQuestionCandidate(candidate);
        if (!validation.ok) {
          bumpReject(ctx.stats, validation.reason);
          bumpSource(ctx.stats, SOURCE_ID, "rejected");
          continue;
        }

        ctx.stats.accepted += 1;
        bumpSource(ctx.stats, SOURCE_ID, "accepted");
        yield candidate;
      }
    }
  }
}
