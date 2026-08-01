#!/usr/bin/env node
/**
 * Alimentação AUTOMÁTICA do banco — roda fila de temas BNCC com pipeline Gerador + Revisor.
 *
 * Uso manual ou via GitHub Actions (cron noturno):
 *   node scripts/ai-question-bank-pipeline-auto.mjs
 *   node scripts/ai-question-bank-pipeline-auto.mjs --topicsPerRun=6 --questionsPerTopic=5
 *
 * Env: GEMINI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createSupabaseAdmin,
  loadEnvLocal,
  INGEST_ROOT,
} from "./lib/question-bank-ingest/shared.mjs";
import { pickTopicsForRun } from "./lib/ai-question-bank-pipeline/topic-queue.mjs";

loadEnvLocal();

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PIPELINE_SCRIPT = join(SCRIPT_DIR, "ai-question-bank-pipeline.mjs");

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

function parseArgs(argv) {
  const args = {
    topicsPerRun: 6,
    questionsPerTopic: 5,
    maxAttemptsPerTopic: 0,
    maxRunMinutes: 105,
    perTopicTimeoutMinutes: 15,
    seed: null,
    targetPublicCount: Number(process.env.QUESTION_BANK_TARGET_PUBLIC_COUNT || "5000"),
    dryRun: false,
    reportPath: join(INGEST_ROOT, "tmp/ai-question-bank-pipeline-auto-report.json"),
  };

  for (const arg of argv) {
    if (arg === "--dry-run") args.dryRun = true;
    else if (arg.startsWith("--topicsPerRun=")) {
      args.topicsPerRun = Math.max(1, Number(arg.split("=")[1]) || 5);
    } else if (arg.startsWith("--questionsPerTopic=")) {
      args.questionsPerTopic = Math.max(1, Number(arg.split("=")[1]) || 3);
    } else if (arg.startsWith("--maxAttemptsPerTopic=")) {
      args.maxAttemptsPerTopic = Math.max(0, Number(arg.split("=")[1]) || 0);
    } else if (arg.startsWith("--maxRunMinutes=")) {
      args.maxRunMinutes = Math.max(5, Number(arg.split("=")[1]) || 105);
    } else if (arg.startsWith("--perTopicTimeoutMinutes=")) {
      args.perTopicTimeoutMinutes = Math.max(2, Number(arg.split("=")[1]) || 15);
    } else if (arg.startsWith("--seed=")) {
      const value = Number(arg.split("=")[1]);
      args.seed = Number.isFinite(value) ? value : null;
    } else if (arg.startsWith("--targetPublicCount=")) {
      args.targetPublicCount = Math.max(0, Number(arg.split("=")[1]) || 0);
    } else if (arg.startsWith("--report=")) {
      args.reportPath = arg.slice("--report=".length);
    }
  }

  if (!args.maxAttemptsPerTopic) {
    args.maxAttemptsPerTopic = Math.max(
      args.questionsPerTopic * 4,
      args.questionsPerTopic + 10,
    );
  }

  return args;
}

function hasTimeForAnotherTopic(deadlineMs, args) {
  const remainingMs = deadlineMs - Date.now();
  return remainingMs > Math.min(args.perTopicTimeoutMinutes * 60_000, 10 * 60_000);
}

async function countPublishedQuestions() {
  const supabase = createSupabaseAdmin();
  const { count, error } = await supabase
    .from("question_bank_items")
    .select("*", { count: "exact", head: true })
    .eq("visibility", "community")
    .eq("is_published", true);

  if (error) {
    throw new Error(`Falha ao contar banco de questões: ${error.message}`);
  }

  return count ?? 0;
}

function runPipelineForTopic(topic, args, deadlineMs) {
  return new Promise((resolve) => {
    const timeoutMs = Math.max(
      1000,
      Math.min(args.perTopicTimeoutMinutes * 60_000, deadlineMs - Date.now()),
    );
    const childArgs = [
      PIPELINE_SCRIPT,
      `--topic=${topic.topic}`,
      `--componente=${topic.componente}`,
      `--anoSerie=${topic.anoSerie}`,
      `--count=${args.questionsPerTopic}`,
      `--maxAttempts=${args.maxAttemptsPerTopic}`,
      `--report=${join(INGEST_ROOT, `tmp/ai-pipeline-${topic.topic.replace(/\s+/g, "-").slice(0, 40)}.json`)}`,
    ];
    if (args.dryRun) childArgs.push("--dry-run");

    log(`→ Pipeline: ${topic.componente} · ${topic.anoSerie} · ${topic.topic}`);

    const child = spawn(process.execPath, childArgs, {
      stdio: "inherit",
      env: process.env,
    });

    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      log(`Tempo limite por tema atingido (${args.perTopicTimeoutMinutes} min). Encerrando tema atual.`);
      child.kill("SIGTERM");
      setTimeout(() => {
        if (child.exitCode === null && child.signalCode === null) {
          child.kill("SIGKILL");
        }
      }, 5000).unref();
    }, timeoutMs);

    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ topic, exitCode: timedOut ? 124 : code ?? 1, timedOut });
    });
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.dryRun && args.targetPublicCount > 0) {
    const current = await countPublishedQuestions();
    log(`Acervo público atual: ${current}/${args.targetPublicCount}`);
    if (current >= args.targetPublicCount) {
      log("Meta de questões públicas já atingida; pulando geração IA.");
      return;
    }
  }

  if (!process.env.GEMINI_API_KEY?.trim()) {
    throw new Error("Defina GEMINI_API_KEY para o pipeline automático.");
  }

  const topics = pickTopicsForRun(args.topicsPerRun, args.seed ?? undefined);

  log("=== Planify · Alimentação automática do banco (IA) ===");
  log(`Temas nesta rodada: ${topics.length} × ${args.questionsPerTopic} questões`);
  log(`Janela máxima: ${args.maxRunMinutes} min | limite por tema: ${args.perTopicTimeoutMinutes} min`);
  log(`Modo: ${args.dryRun ? "DRY-RUN" : "PRODUÇÃO"}`);

  const startedAt = new Date().toISOString();
  const deadlineMs = Date.now() + args.maxRunMinutes * 60_000;
  const results = [];
  const skipped = [];

  for (let index = 0; index < topics.length; index += 1) {
    const topic = topics[index];
    if (!hasTimeForAnotherTopic(deadlineMs, args)) {
      log("Janela da rodada quase no fim; encerrando antes do timeout do GitHub.");
      skipped.push(...topics.slice(index));
      break;
    }

    const result = await runPipelineForTopic(topic, args, deadlineMs);
    results.push(result);
  }

  const summary = {
    startedAt,
    finishedAt: new Date().toISOString(),
    config: args,
    topics: topics.map((t) => ({ ...t })),
    results,
    skipped,
    successCount: results.filter((r) => r.exitCode === 0).length,
    partialCount: results.filter((r) => r.exitCode === 2).length,
    failCount: results.filter((r) => r.exitCode !== 0 && r.exitCode !== 2).length,
  };

  mkdirSync(dirname(args.reportPath), { recursive: true });
  writeFileSync(args.reportPath, JSON.stringify(summary, null, 2), "utf8");

  log("=== Resumo automático ===");
  log(`Temas OK: ${summary.successCount} | parcial: ${summary.partialCount} | falha: ${summary.failCount}`);
  log(`Temas pulados por tempo: ${summary.skipped.length}`);
  log(`Relatório: ${args.reportPath}`);

  const productiveCount = summary.successCount + summary.partialCount;
  if (productiveCount === 0 && (summary.failCount > 0 || summary.skipped.length > 0)) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
