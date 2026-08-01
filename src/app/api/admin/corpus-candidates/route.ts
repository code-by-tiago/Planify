import { NextRequest, NextResponse } from "next/server";
import { requireOwnerApi } from "@/server/auth/owner-access";
import {
  listCorpusCandidates,
  type CorpusReviewStatus,
} from "@/server/corpus/corpus-candidates-db-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseStatus(value: string | null): CorpusReviewStatus | "all" {
  if (value === "approved" || value === "rejected" || value === "all") {
    return value;
  }
  return "pending";
}

function serializeCandidate(row: Awaited<
  ReturnType<typeof listCorpusCandidates>
>["items"][number]) {
  return {
    id: row.id,
    tema: row.tema,
    tipo: row.tipo,
    surface: row.surface,
    discipline: row.discipline,
    bnccCodigos: row.bncc_codigos,
    qualityScore: row.quality_score,
    reviewStatus: row.review_status,
    contentSummary: row.content_summary,
    topicSignature: row.topic_signature,
    sourceTable: row.source_table,
    sourceId: row.source_id,
    createdAt: row.created_at,
  };
}

export async function GET(request: NextRequest) {
  const gate = await requireOwnerApi(request);
  if (!gate.ok) return gate.response;

  const params = request.nextUrl.searchParams;
  const status = parseStatus(params.get("status"));
  const q = params.get("q") || undefined;
  const page = Math.max(1, Number(params.get("page") || 1));
  const limit = Math.min(100, Math.max(1, Number(params.get("limit") || 25)));

  const result = await listCorpusCandidates({ status, q, page, limit });

  return NextResponse.json(
    {
      success: true,
      candidates: result.items.map(serializeCandidate),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        pages: Math.max(1, Math.ceil(result.total / result.limit)),
      },
    },
    {
      headers: { "Cache-Control": "no-store" },
    },
  );
}
