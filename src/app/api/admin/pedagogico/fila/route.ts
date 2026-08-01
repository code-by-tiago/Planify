import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/server/auth/admin-access";
import { listPendingEntries } from "@/server/pedagogical-cache/pedagogical-cache-db-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const gate = await requireAdminApi(request);
  if (!gate.ok) return gate.response;

  const limit = Math.min(
    100,
    Math.max(1, Number(request.nextUrl.searchParams.get("limit") || 50)),
  );

  const entries = await listPendingEntries(limit);

  return NextResponse.json({
    success: true,
    entries: entries.map((entry) => ({
      id: entry.id,
      title: entry.title,
      summary: entry.summary,
      bodyMarkdown: entry.body_markdown,
      reviewStatus: entry.review_status,
      sourceUrl: entry.source_url,
      sourceTitle: entry.source_title,
      bnccCodigos: entry.bncc_codigos,
      createdAt: entry.created_at,
      sourceSlug: entry.source_slug,
    })),
  });
}
