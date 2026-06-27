import { NextRequest, NextResponse } from "next/server";
import { requireOwnerApi } from "@/server/auth/owner-access";
import { updateCorpusCandidateReview } from "@/server/corpus/corpus-candidates-db-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ReviewPayload = {
  action?: "approve" | "reject";
};

function serializeCandidate(row: Awaited<ReturnType<typeof updateCorpusCandidateReview>>) {
  return {
    id: row.id,
    tema: row.tema,
    reviewStatus: row.review_status,
    qualityScore: row.quality_score,
    bnccCodigos: row.bncc_codigos,
    surface: row.surface,
  };
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const gate = await requireOwnerApi(request);
  if (!gate.ok) return gate.response;

  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as ReviewPayload | null;
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

  const candidate = await updateCorpusCandidateReview(
    id,
    action === "approve" ? "approved" : "rejected",
  );

  return NextResponse.json({
    success: true,
    candidate: serializeCandidate(candidate),
  });
}
