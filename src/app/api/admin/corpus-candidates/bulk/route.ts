import { NextRequest, NextResponse } from "next/server";
import { requireOwnerApi } from "@/server/auth/owner-access";
import { bulkUpdateCorpusCandidateReview } from "@/server/corpus/corpus-candidates-db-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BulkPayload = {
  ids?: string[];
  action?: "approve" | "reject";
};

export async function PATCH(request: NextRequest) {
  const gate = await requireOwnerApi(request);
  if (!gate.ok) return gate.response;

  const body = (await request.json().catch(() => null)) as BulkPayload | null;
  const ids = Array.isArray(body?.ids)
    ? body!.ids.filter((id) => typeof id === "string" && id.trim())
    : [];
  const action = body?.action;

  if (ids.length === 0) {
    return NextResponse.json(
      { success: false, error: { message: "Informe ao menos um id." } },
      { status: 400 },
    );
  }

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json(
      {
        success: false,
        error: { message: 'Informe action: "approve" ou "reject".' },
      },
      { status: 400 },
    );
  }

  const updated = await bulkUpdateCorpusCandidateReview(
    ids,
    action === "approve" ? "approved" : "rejected",
  );

  return NextResponse.json({
    success: true,
    updated,
  });
}
