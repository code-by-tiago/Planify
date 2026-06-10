/**
 * Dispara scrape idempotente para os temas com mais miss no reservatório.
 * Run: npm run seed:pedagogical-miss-queue
 *
 * Requer NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 * Para local sem DB: PEDAGOGICAL_MISS_SIMULATE=1 PEDAGOGICAL_MISS_THEMES="Fotossíntese,Democracia"
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const MAX_THEMES = Number(process.env.PEDAGOGICAL_MISS_LIMIT || 10);
const WINDOW_DAYS = Number(process.env.PEDAGOGICAL_MISS_WINDOW_DAYS || 7);

function loadEnvLocal() {
  try {
    for (const line of readFileSync(join(root, ".env.local"), "utf8").split(/\r?\n/)) {
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

loadEnvLocal();

function parseSimulatedThemes() {
  const raw = process.env.PEDAGOGICAL_MISS_THEMES || "";
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((tema) => ({ tema, count: 1 }));
}

async function listTopMissThemes(supabase) {
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("operational_events")
    .select("metadata")
    .eq("event_type", "pedagogical_cache_miss")
    .gte("created_at", since);

  if (error) throw new Error(error.message);

  const counts = new Map();
  for (const row of data || []) {
    const tema = String(row.metadata?.tema || "").trim();
    if (!tema) continue;
    counts.set(tema, (counts.get(tema) || 0) + 1);
  }

  return [...counts.entries()]
    .map(([tema, count]) => ({ tema, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, MAX_THEMES);
}

async function hasRecentScrapeJob(supabase, tema) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("pedagogical_scrape_jobs")
    .select("id, query")
    .gte("created_at", since)
    .in("status", ["queued", "running", "completed"])
    .limit(50);

  if (error) throw new Error(error.message);

  return (data || []).some((job) => String(job.query?.tema || "").trim() === tema);
}

async function triggerIngestCron() {
  const secret = process.env.CRON_SECRET?.trim();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;

  if (!secret || !baseUrl) {
    console.warn("CRON_SECRET ou URL da app ausente; apenas listando temas miss.");
    return false;
  }

  const url = `${baseUrl.replace(/\/$/, "")}/api/cron/pedagogico/ingest`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
    },
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.error?.message || `HTTP ${response.status}`);
  }

  console.log("Cron ingest disparado:", body);
  return true;
}

async function main() {
  if (process.env.PEDAGOGICAL_MISS_SIMULATE === "1") {
    const themes = parseSimulatedThemes();
    console.log("Modo simulado — temas:", themes.map((item) => item.tema).join(", "));
    await triggerIngestCron();
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const themes = await listTopMissThemes(supabase);
  if (!themes.length) {
    console.log("Nenhum tema miss nos últimos", WINDOW_DAYS, "dias.");
    return;
  }

  console.log("Top miss themes:");
  for (const item of themes) {
    console.log(`- ${item.tema} (${item.count})`);
  }

  let queued = 0;
  for (const item of themes) {
    const recent = await hasRecentScrapeJob(supabase, item.tema);
    if (recent) {
      console.log(`Skip (job recente): ${item.tema}`);
      continue;
    }

    const { error } = await supabase.from("pedagogical_scrape_jobs").insert({
      trigger: "seed_miss_queue",
      query: { tema: item.tema },
      status: "queued",
    });

    if (error) {
      console.warn(`Falha ao enfileirar ${item.tema}:`, error.message);
      continue;
    }

    queued += 1;
  }

  console.log(`seed:pedagogical-miss-queue OK — ${queued} job(s) enfileirado(s).`);
  await triggerIngestCron();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
