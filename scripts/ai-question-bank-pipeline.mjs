#!/usr/bin/env node
/**
 * Pipeline IA em duas etapas — banco de questões Planify (K-12 BR / BNCC).
 *
 * ETAPA 1 GERADOR — gemini-3.5-flash → questão MC (A–E) + gabarito + justificativa (JSON)
 * ETAPA 2 REVISOR — valida gabarito único, clareza, adequação escolar (JSON)
 * FILTRO — nota > 8 + validação local → limpa texto → insere em question_bank_items
 *
 * Uso:
 *   node scripts/ai-question-bank-pipeline.mjs --topic="Frações" --componente="Matemática" --anoSerie="5º ano" --count=10
 *   node scripts/ai-question-bank-pipeline.mjs --topic="Revolução Industrial" --componente="História" --anoSerie="9º ano" --count=5 --dry-run
 *
 * Env: GEMINI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Opcional: GEMINI_MODEL (default gemini-3.5-flash), PLANIFY_OWNER_USER_ID
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createIngestStats,
  createSupabaseAdmin,
  loadEnvLocal,
  loadTsModule,
  persistQuestion,
  resolveCuratorUserId,
  sleep,
  validateQuestionCandidate,
  bumpReject,
  INGEST_ROOT,
} from "./lib/question-bank-ingest/shared.mjs";
import {
  callGeminiJson,
  createGeminiClient,
  GENERATOR_RESPONSE_SCHEMA,
  getDefaultGeminiModel,
  REVIEWER_RESPONSE_SCHEMA,
} from "./lib/ai-question-bank-pipeline/gemini.mjs";
import {
  buildGeneratorSystemPrompt,
  buildGeneratorUserPrompt,
  buildReviewerSystemPrompt,
  buildReviewerUserPrompt,
} from "./lib/ai-question-bank-pipeline/prompts.mjs";
import {
  containsCompetitorMention,
  deriveEtapa,
  isReviewApproved,
  normalizeGeneratedQuestion,
  validateGeneratorShape,
} from "./lib/ai-question-bank-pipeline/filter.mjs";

loadEnvLocal();

const SCRIPT_ROOT = dirname(fileURLToPath(import.meta.url));
const { computeQuestionContentHash } = loadTsModule("src/lib/banco-questoes/question-bank-hash.ts");

const DEFAULT_MODEL = getDefaultGeminiModel();
const SOURCE_ID = "ai-gemini";

function log(msg) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${msg}`);
}

/**
 * @param {string[]} argv
 */
function parsePipelineArgs(argv) {
  const args = {
    topic: "",
    componente: "Multicomponente",
    anoSerie: "Geral",
    count: 10,
    maxAttempts: 50,
    model: DEFAULT_MODEL,
    dryRun: false,
    reportPath: join(INGEST_ROOT, "tmp/ai-question-bank-pipeline-report.json"),
  };

  for (const arg of argv) {
    if (arg === "--dry-run") args.dryRun = true;
    else if (arg.startsWith("--topic=")) args.topic = arg.slice("--topic=".length).trim();
    else if (arg.startsWith("--componente=")) args.componente = arg.slice("--componente=".length).trim();
    else if (arg.startsWith("--anoSerie=")) args.anoSerie = arg.slice("--anoSerie=".length).trim();
    else if (arg.startsWith("--count=")) args.count = Math.max(1, Number(arg.split("=")[1]) || 10);
    else if (arg.startsWith("--maxAttempts=")) {
      args.maxAttempts = Math.max(args.count, Number(arg.split("=")[1]) || 50);
    } else if (arg.startsWith("--model=")) args.model = arg.slice("--model=".length).trim();
    else if (arg.startsWith("--report=")) args.reportPath = arg.slice("--report=".length);
  }

  if (!args.topic) {
    throw new Error('Informe --topic="Tema da questão" (obrigatório).');
  }

  return args;
}

/**
 * @param {ReturnType<typeof parsePipelineArgs>} args
 */
async function runGenerator(client, args, ctx) {
  const systemInstruction = buildGeneratorSystemPrompt(ctx);
  const prompt = buildGeneratorUserPrompt(ctx);
  return callGeminiJson({
    client,
    systemInstruction,
    prompt,
    schema: GENERATOR_RESPONSE_SCHEMA,
    model: args.model,
    temperature: 0.75,
    log,
  });
}

/**
 * @param {ReturnType<typeof parsePipelineArgs>} args
 * @param {object} generated
 */
async function runReviewer(client, args, ctx, generated) {
  const systemInstruction = buildReviewerSystemPrompt();
  const prompt = buildReviewerUserPrompt(generated, ctx);
  return callGeminiJson({
    client,
    systemInstruction,
    prompt,
    schema: REVIEWER_RESPONSE_SCHEMA,
    model: args.model,
    temperature: 0.15,
    log,
  });
}

/**
 * @param {object} params
 */
function recordAttempt(report, params) {
  report.attempts.push({
    at: new Date().toISOString(),
    ...params,
  });
}

async function main() {
  const args = parsePipelineArgs(process.argv.slice(2));
  const client = createGeminiClient();

  const etapa = deriveEtapa(args.anoSerie);
  const ctx = {
    topic: args.topic,
    componente: args.componente,
    anoSerie: args.anoSerie,
    etapa,
  };

  log("=== Planify · Pipeline IA banco de questões ===");
  log(`Tema: ${args.topic} | ${args.componente} | ${args.anoSerie} (${etapa})`);
  log(`Meta: ${args.count} questões | max tentativas: ${args.maxAttempts} | modelo: ${args.model}`);
  log(`Modo: ${args.dryRun ? "DRY-RUN" : "PRODUÇÃO"}`);

  const supabase = createSupabaseAdmin();
  const userId = await resolveCuratorUserId(supabase);
  log(`Curador user_id: ${userId}`);

  const stats = createIngestStats();
  const startedAt = new Date().toISOString();
  const report = {
    startedAt,
    finishedAt: null,
    config: { ...args, etapa, sourceId: SOURCE_ID },
    inserted: [],
    attempts: [],
    stats: null,
  };

  let attempts = 0;

  while (stats.inserted < args.count && attempts < args.maxAttempts) {
    attempts += 1;
    stats.scanned += 1;

    log(`--- Tentativa ${attempts}/${args.maxAttempts} (inseridas: ${stats.inserted}/${args.count}) ---`);

    let generated;
    try {
      generated = await runGenerator(client, args, ctx);
    } catch (error) {
      stats.errors += 1;
      const msg = error instanceof Error ? error.message : String(error);
      log(`ERRO gerador: ${msg}`);
      recordAttempt(report, { stage: "generator", status: "error", error: msg });
      await sleep(1500);
      continue;
    }

    const shape = validateGeneratorShape(generated);
    if (!shape.ok) {
      bumpReject(stats, shape.reason);
      log(`Rejeitado (estrutura gerador): ${shape.reason}`);
      recordAttempt(report, { stage: "generator", status: "rejected", reason: shape.reason, generated });
      continue;
    }

    if (
      containsCompetitorMention(generated.enunciado) ||
      containsCompetitorMention(generated.justificativa) ||
      (generated.texto_apoio && containsCompetitorMention(generated.texto_apoio))
    ) {
      bumpReject(stats, "mencao_concorrente_gerador");
      log("Rejeitado: menção a concorrente na saída do gerador");
      recordAttempt(report, {
        stage: "generator",
        status: "rejected",
        reason: "mencao_concorrente_gerador",
      });
      continue;
    }

    let review;
    try {
      review = await runReviewer(client, args, ctx, generated);
    } catch (error) {
      stats.errors += 1;
      const msg = error instanceof Error ? error.message : String(error);
      log(`ERRO revisor: ${msg}`);
      recordAttempt(report, { stage: "reviewer", status: "error", error: msg, generated });
      await sleep(1500);
      continue;
    }

    if (!isReviewApproved(review)) {
      const reason = `revisor_nota_${review?.nota ?? "?"}_${review?.motivo ?? "reprovado"}`;
      bumpReject(stats, "revisor_reprovou");
      log(`Reprovado pelo revisor (nota ${review?.nota}): ${review?.motivo || "—"}`);
      recordAttempt(report, {
        stage: "reviewer",
        status: "rejected",
        review,
        generated,
        reason,
      });
      continue;
    }

    const question = normalizeGeneratedQuestion(generated, ctx);

    if (
      containsCompetitorMention(question.enunciado) ||
      containsCompetitorMention(question.criterioCorrecao) ||
      (question.textoApoio && containsCompetitorMention(question.textoApoio)) ||
      question.alternativas.some((a) => containsCompetitorMention(a))
    ) {
      bumpReject(stats, "mencao_concorrente_pos_filtro");
      log("Rejeitado: menção a concorrente após normalização");
      recordAttempt(report, {
        stage: "filter",
        status: "rejected",
        reason: "mencao_concorrente_pos_filtro",
      });
      continue;
    }

    const localValidation = validateQuestionCandidate({
      enunciado: question.enunciado,
      textoApoio: question.textoApoio,
      tipo: question.tipo,
      alternativas: question.alternativas,
      respostaEsperada: question.respostaEsperada,
      criterioCorrecao: question.criterioCorrecao,
      sourceType: question.sourceType,
    });

    if (!localValidation.ok) {
      bumpReject(stats, localValidation.reason || "validacao_local");
      log(`Rejeitado (validação local): ${localValidation.reason}`);
      recordAttempt(report, {
        stage: "filter",
        status: "rejected",
        reason: localValidation.reason,
        question,
        review,
      });
      continue;
    }

    stats.accepted += 1;

    const contentHash = computeQuestionContentHash(question.enunciado, question.tipo);
    const result = await persistQuestion(supabase, userId, question, {
      dryRun: args.dryRun,
      hashFn: computeQuestionContentHash,
    });

    if (result.status === "duplicate") {
      stats.duplicates += 1;
      log(`Duplicata (content_hash=${contentHash}) — descartando`);
      recordAttempt(report, {
        stage: "persist",
        status: "duplicate",
        contentHash,
        review,
      });
      continue;
    }

    if (result.status === "error") {
      stats.errors += 1;
      log(`Erro ao inserir: ${result.message}`);
      recordAttempt(report, {
        stage: "persist",
        status: "error",
        message: result.message,
        contentHash,
      });
      continue;
    }

    if (result.status === "inserted" || result.status === "dry_run") {
      stats.inserted += 1;
      log(
        `${args.dryRun ? "[DRY-RUN] Aceita" : "Inserida"} questão #${stats.inserted} (hash=${contentHash}, nota=${review.nota})`,
      );
      report.inserted.push({
        contentHash,
        nota: review.nota,
        motivo: review.motivo,
        enunciadoPreview: question.enunciado.slice(0, 120),
        dryRun: args.dryRun,
      });
      recordAttempt(report, {
        stage: "persist",
        status: result.status,
        contentHash,
        nota: review.nota,
      });
    }

    await sleep(400);
  }

  report.finishedAt = new Date().toISOString();
  report.stats = stats;

  mkdirSync(dirname(args.reportPath), { recursive: true });
  writeFileSync(args.reportPath, JSON.stringify(report, null, 2), "utf8");

  log("=== Resumo ===");
  log(`Inseridas: ${stats.inserted}/${args.count}`);
  log(`Tentativas: ${attempts} | Aceitas: ${stats.accepted} | Rejeitadas: ${stats.rejected}`);
  log(`Duplicatas: ${stats.duplicates} | Erros: ${stats.errors}`);
  log(`Relatório: ${args.reportPath}`);

  if (stats.inserted < args.count) {
    log(`AVISO: meta não atingida (${stats.inserted}/${args.count}) após ${attempts} tentativas.`);
    process.exitCode = 2;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
