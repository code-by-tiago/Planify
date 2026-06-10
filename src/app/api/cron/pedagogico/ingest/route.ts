import { NextRequest, NextResponse } from "next/server";
import {
  entryToScrapeQuery,
  listStaleEntriesForRefresh,
  listTopMissThemes,
} from "@/server/pedagogical-cache/pedagogical-cache-db-service";
import { scrapePedagogicalSources } from "@/server/pedagogical-cache/scrape-orchestrator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ITEMS_PER_RUN = 20;

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const authHeader = request.headers.get("authorization") || "";
  const bearer = authHeader.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();

  if (!secret || bearer !== secret) {
    return NextResponse.json(
      { success: false, error: { message: "Não autorizado." } },
      { status: 401 },
    );
  }

  const staleLimit = Math.min(
    MAX_ITEMS_PER_RUN,
    Math.max(1, Number(request.nextUrl.searchParams.get("stale_limit") || 10)),
  );
  const missLimit = Math.min(
    MAX_ITEMS_PER_RUN - staleLimit,
    Math.max(0, Number(request.nextUrl.searchParams.get("miss_limit") || 10)),
  );

  const [staleEntries, missThemes] = await Promise.all([
    listStaleEntriesForRefresh(staleLimit),
    listTopMissThemes(7, missLimit),
  ]);

  const processed: Array<{
    kind: "stale" | "miss";
    tema: string;
    jobId: string;
    entries: number;
  }> = [];
  const errors: Array<{ tema: string; message: string }> = [];

  for (const entry of staleEntries) {
    const query = entryToScrapeQuery(entry);
    if (!query.tema) continue;

    try {
      const { entries, jobId } = await scrapePedagogicalSources({
        query,
        trigger: "cron_stale_refresh",
      });
      processed.push({
        kind: "stale",
        tema: query.tema,
        jobId,
        entries: entries.length,
      });
    } catch (error) {
      errors.push({
        tema: query.tema,
        message: error instanceof Error ? error.message : "Erro ao re-scrape.",
      });
    }
  }

  for (const miss of missThemes) {
    try {
      const { entries, jobId } = await scrapePedagogicalSources({
        query: {
          tema: miss.tema,
          componente: miss.componente,
          etapa: miss.etapa,
        },
        trigger: "cron_miss_queue",
      });
      processed.push({
        kind: "miss",
        tema: miss.tema,
        jobId,
        entries: entries.length,
      });
    } catch (error) {
      errors.push({
        tema: miss.tema,
        message: error instanceof Error ? error.message : "Erro ao scrape miss.",
      });
    }
  }

  return NextResponse.json({
    success: true,
    processed: processed.length,
    staleQueued: staleEntries.length,
    missQueued: missThemes.length,
    items: processed,
    errors,
  });
}
