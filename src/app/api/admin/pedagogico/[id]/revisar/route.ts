import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/server/auth/admin-access";
import { reviewCacheEntry } from "@/server/pedagogical-cache/pedagogical-cache-db-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RevisarPayload = {
  action?: "approve" | "reject";
  notes?: string;
};

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdminApi(request);
  if (!gate.ok) return gate.response;

  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as RevisarPayload | null;
  const action = body?.action;

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json(
      {
        success: false,
        error: { message: 'Informe action: "approve" ou "reject".' },
      },
      { status: 400 },
    );
  }

  const reviewerId = gate.admin.userId;
  if (!reviewerId) {
    return NextResponse.json(
      { success: false, error: { message: "Usuário admin não identificado." } },
      { status: 400 },
    );
  }

  const entry = await reviewCacheEntry(
    id,
    action === "approve" ? "approved" : "rejected",
    reviewerId,
    body?.notes,
  );

  return NextResponse.json({
    success: true,
    entry: {
      id: entry.id,
      title: entry.title,
      reviewStatus: entry.review_status,
      reviewedAt: entry.reviewed_at,
    },
  });
}
