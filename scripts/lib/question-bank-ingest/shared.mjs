/**
 * Utilitários compartilhados — ingestão em massa do banco de questões Planify.
 */
import { createClient } from "@supabase/supabase-js";
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
export const INGEST_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");

export function loadEnvLocal() {
  try {
    for (const line of readFileSync(join(INGEST_ROOT, ".env.local"), "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // optional
  }
}

export function loadTsModule(relativePath) {
  const ts = require("typescript");
  const sourcePath = join(INGEST_ROOT, relativePath);
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
    if (specifier.startsWith("@/")) {
      const rel = `src/${specifier.slice(2)}`;
      for (const candidate of [`${rel}.ts`, `${rel}.tsx`]) {
        try {
          readFileSync(join(INGEST_ROOT, candidate));
          return loadTsModule(candidate);
        } catch {
          // try next
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
  return module.exports;
}

export function createSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function resolveCuratorUserId(supabase) {
  const ownerUserId = process.env.PLANIFY_OWNER_USER_ID?.trim();
  if (ownerUserId) return ownerUserId;

  const { data: owner } = await supabase
    .from("profiles")
    .select("id")
    .or("is_owner.eq.true,is_admin.eq.true")
    .limit(1)
    .maybeSingle();

  if (owner?.id) return owner.id;

  const { data: anyProfile } = await supabase
    .from("profiles")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (!anyProfile?.id) {
    throw new Error("Nenhum perfil encontrado para atribuir questões ingeridas.");
  }

  return anyProfile.id;
}

const GENERIC_PATTERNS = [
  /conte[uú]do estudado/i,
  /explique o conceito/i,
  /lorem ipsum/i,
  /placeholder/i,
  /todas as anteriores/i,
  /nenhuma das anteriores/i,
];

/** Fórum universitário em inglês — não é questão escolar BR */
const FORUM_ENGLISH_PATTERNS = [
  /\bI\s+(used|have|played|tried|made)\b/i,
  /\bEDIT:\b/i,
  /\bany hints\b/i,
  /\bshow that\b/i,
  /\bprove that\b/i,
  /\bsimulation\b/i,
  /\bExcel\b/i,
];

const UNIVERSITY_TOPIC_PATTERNS = [
  /automorphism/i,
  /dihedral/i,
  /homomorphism/i,
  /eigenvalue/i,
  /stochastic/i,
  /manifold/i,
  /isomorphism/i,
];

const RAW_LATEX = /\$[^$]{2,}\$|\\\(|\\\)|\\frac|\\binom|\\color|\\begin\{/;

const PT_SIGNAL =
  /[áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]|\b(qual|quanto|quais|calcule|determine|assinale|marque|explique|resolva|encontre|verdadeiro|falso|alternativa|questão|exercício)\b/i;

const INTERNAL_SOURCE_PREFIXES = [
  "ingest:planify",
  "planify:",
  "ingest:planify-biblioteca",
  "ingest:planify-materials",
];

export function normalizeWhitespace(text) {
  return String(text || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function stripHtml(html) {
  return normalizeWhitespace(
    String(html || "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  );
}

/**
 * @param {object} q
 * @returns {{ ok: boolean; reason?: string }}
 */
function isInternalCuratedSource(sourceType) {
  const st = String(sourceType || "");
  return INTERNAL_SOURCE_PREFIXES.some((prefix) => st.startsWith(prefix));
}

export function validateQuestionCandidate(q) {
  const enunciado = normalizeWhitespace(q.enunciado);
  const textoApoio = normalizeWhitespace(q.textoApoio || "");
  const sourceType = String(q.sourceType || "");

  let hasReading = false;
  try {
    const selfContainedMod = loadTsModule(
      "src/lib/banco-questoes/question-bank-self-contained.ts",
    );
    const selfContained = selfContainedMod.isQuestionSelfContained(
      enunciado,
      textoApoio || undefined,
    );
    if (!selfContained.ok) return { ok: false, reason: selfContained.reason };
    hasReading =
      textoApoio.length >= 40 ||
      selfContainedMod.hasEmbeddedReadingContext(enunciado);
  } catch {
    // fallback silencioso — demais regras abaixo
  }

  if (enunciado.length < 35) return { ok: false, reason: "enunciado_curto" };
  const maxLen = hasReading ? 3200 : 900;
  if (enunciado.length > maxLen) return { ok: false, reason: "enunciado_longo" };
  if (/https?:\/\//i.test(enunciado)) return { ok: false, reason: "url_no_enunciado" };

  if (RAW_LATEX.test(enunciado)) return { ok: false, reason: "latex_cru" };

  for (const pattern of GENERIC_PATTERNS) {
    if (pattern.test(enunciado)) return { ok: false, reason: "texto_generico" };
  }

  if (!isInternalCuratedSource(sourceType)) {
    for (const pattern of FORUM_ENGLISH_PATTERNS) {
      if (pattern.test(enunciado)) return { ok: false, reason: "forum_ingles" };
    }
    for (const pattern of UNIVERSITY_TOPIC_PATTERNS) {
      if (pattern.test(enunciado)) return { ok: false, reason: "nivel_universitario" };
    }

    const englishHits = (enunciado.match(
      /\b(the|and|of|is|are|what|how|find|prove|show|that|with|from|this|which)\b/gi,
    ) || []).length;

    if (!PT_SIGNAL.test(enunciado) && englishHits >= 3) {
      return { ok: false, reason: "idioma_nao_pt" };
    }
  }

  const tipo = String(q.tipo || "discursiva").toLowerCase();
  const isMc =
    tipo.includes("objetiva") ||
    tipo.includes("multipla") ||
    (Array.isArray(q.alternativas) && q.alternativas.length >= 3);

  if (isMc) {
    const alts = (q.alternativas || [])
      .map((a) => normalizeWhitespace(a))
      .filter((a) => a.length >= 2);
    if (alts.length < 3) return { ok: false, reason: "poucas_alternativas" };
    const unique = new Set(alts.map((a) => a.toLowerCase()));
    if (unique.size < alts.length) return { ok: false, reason: "alternativas_repetidas" };
  }

  const resposta = normalizeWhitespace(q.respostaEsperada || q.criterioCorrecao);
  if (resposta.length < 1) return { ok: false, reason: "sem_gabarito" };

  return { ok: true };
}

export function createIngestStats() {
  return {
    scanned: 0,
    accepted: 0,
    rejected: 0,
    duplicates: 0,
    inserted: 0,
    errors: 0,
    bySource: {},
    rejectReasons: {},
  };
}

export function bumpReject(stats, reason) {
  stats.rejected += 1;
  stats.rejectReasons[reason] = (stats.rejectReasons[reason] || 0) + 1;
}

export function bumpSource(stats, sourceId, field) {
  if (!stats.bySource[sourceId]) {
    stats.bySource[sourceId] = {
      scanned: 0,
      accepted: 0,
      inserted: 0,
      duplicates: 0,
      rejected: 0,
    };
  }
  stats.bySource[sourceId][field] += 1;
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 */
export async function persistQuestion(supabase, userId, question, { dryRun, hashFn }) {
  const contentHash = hashFn(question.enunciado, question.tipo);

  const { data: existing } = await supabase
    .from("question_bank_items")
    .select("id")
    .eq("content_hash", contentHash)
    .maybeSingle();

  if (existing?.id) {
    return { status: "duplicate", contentHash };
  }

  if (dryRun) {
    return { status: "dry_run", contentHash };
  }

  const now = new Date().toISOString();
  const { error } = await supabase.from("question_bank_items").insert({
    user_id: userId,
    enunciado: question.enunciado,
    texto_apoio: question.textoApoio?.trim() || null,
    tipo: question.tipo,
    alternativas: question.alternativas || [],
    resposta_esperada: question.respostaEsperada || "",
    criterio_correcao: question.criterioCorrecao || question.respostaEsperada || "",
    componente: question.componente || "Multicomponente",
    ano_serie: question.anoSerie || "Geral",
    etapa: question.etapa || "",
    tema: question.tema || "",
    bncc_codigos: question.bnccCodigos || [],
    tags: question.tags || [],
    source_title: question.sourceTitle || "Ingestão Planify",
    source_type: question.sourceType || "ingest",
    content_hash: contentHash,
    visibility: "community",
    is_published: true,
    published_at: now,
    author_display_name: question.authorName || "Planify Curadoria OER",
    usage_count: 0,
    created_at: now,
    updated_at: now,
  });

  if (error) {
    return { status: "error", message: error.message, contentHash };
  }

  return { status: "inserted", contentHash };
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function parseArgs(argv) {
  const args = {
    hours: 1,
    max: 0,
    dryRun: false,
    sources: "all",
    reportPath: join(INGEST_ROOT, "tmp/question-bank-ingest-report.json"),
  };

  for (const arg of argv) {
    if (arg === "--dry-run") args.dryRun = true;
    else if (arg.startsWith("--hours=")) args.hours = Number(arg.split("=")[1]) || 1;
    else if (arg.startsWith("--max=")) args.max = Number(arg.split("=")[1]) || 0;
    else if (arg.startsWith("--sources=")) args.sources = arg.split("=")[1] || "all";
    else if (arg.startsWith("--report=")) args.reportPath = arg.slice("--report=".length);
  }

  return args;
}

export function writeReport(reportPath, payload) {
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, JSON.stringify(payload, null, 2), "utf8");
}

export function shouldStop(deadlineMs, stats, maxItems) {
  if (Date.now() >= deadlineMs) return "deadline";
  if (maxItems > 0 && stats.inserted >= maxItems) return "max_items";
  return null;
}
