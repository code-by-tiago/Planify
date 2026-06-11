#!/usr/bin/env node
/**
 * Alimentação AUTOMÁTICA do banco — roda fila de temas BNCC com pipeline Gerador + Revisor.
 *
 * Uso manual ou via GitHub Actions (cron noturno):
 *   node scripts/ai-question-bank-pipeline-auto.mjs
 *   node scripts/ai-question-bank-pipeline-auto.mjs --topicsPerRun=20 --questionsPerTopic=10
 *
 * Env: GEMINI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvLocal, INGEST_ROOT } from "./lib/question-bank-ingest/shared.mjs";
import { pickTopicsForRun } from "./lib/ai-question-bank-pipeline/topic-queue.mjs";

loadEnvLocal();

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PIPELINE_SCRIPT = join(SCRIPT_DIR, "ai-question-bank-pipeline.mjs");

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

function parseArgs(argv) {
  const args = {
    topicsPerRun: 20,
    questionsPerTopic: 10,
    maxAttemptsPerTopic: 0,
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

function runPipelineForTopic(topic, args) {
  return new Promise((resolve) => {
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

    child.on("close", (code) => {
      resolve({ topic, exitCode: code ?? 1 });
    });
  });
}

async function main() {
  if (!process.env.GEMINI_API_KEY?.trim()) {
    throw new Error("Defina GEMINI_API_KEY para o pipeline automático.");
  }

  const args = parseArgs(process.argv.slice(2));
  const topics = pickTopicsForRun(args.topicsPerRun);

  log("=== Planify · Alimentação automática do banco (IA) ===");
  log(`Temas nesta rodada: ${topics.length} × ${args.questionsPerTopic} questões`);
  log(`Modo: ${args.dryRun ? "DRY-RUN" : "PRODUÇÃO"}`);

  const startedAt = new Date().toISOString();
  const results = [];

  for (const topic of topics) {
    const result = await runPipelineForTopic(topic, args);
    results.push(result);
  }

  const summary = {
    startedAt,
    finishedAt: new Date().toISOString(),
    config: args,
    topics: topics.map((t) => ({ ...t })),
    results,
    successCount: results.filter((r) => r.exitCode === 0).length,
    partialCount: results.filter((r) => r.exitCode === 2).length,
    failCount: results.filter((r) => r.exitCode !== 0 && r.exitCode !== 2).length,
  };

  mkdirSync(dirname(args.reportPath), { recursive: true });
  writeFileSync(args.reportPath, JSON.stringify(summary, null, 2), "utf8");

  log("=== Resumo automático ===");
  log(`Temas OK: ${summary.successCount} | parcial: ${summary.partialCount} | falha: ${summary.failCount}`);
  log(`Relatório: ${args.reportPath}`);

  if (summary.failCount > 0) process.exitCode = 1;
  else if (summary.partialCount > 0) process.exitCode = 2;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
