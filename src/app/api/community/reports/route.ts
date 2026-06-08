import { NextRequest, NextResponse } from "next/server";
import { requireApiPremiumAccess } from "../../../../server/auth/api-access";
import {
  createCommunityReport,
  type CommunityReportTarget,
} from "../../../../server/community/community-reports-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: { message } }, { status });
}

const VALID_TARGETS: CommunityReportTarget[] = ["material", "comment", "user"];

export async function POST(request: NextRequest) {
  const access = await requireApiPremiumAccess(request);

  if (!access.ok) {
    return access.response;
  }

  const userId = access.access.user?.id;

  if (!userId) {
    return jsonError("Não foi possível identificar sua conta.", 401);
  }

  const body = await request.json().catch(() => ({}));
  const targetType = String(body.targetType || "").trim() as CommunityReportTarget;
  const targetId = String(body.targetId || "").trim();
  const reason = String(body.reason || "").trim();

  if (!VALID_TARGETS.includes(targetType)) {
    return jsonError("Tipo de denúncia inválido.", 400);
  }

  if (!targetId) {
    return jsonError("Alvo da denúncia não informado.", 400);
  }

  try {
    await createCommunityReport({
      reporterUserId: userId,
      targetType,
      targetId,
      reason,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Não foi possível registrar denúncia.",
      400,
    );
  }
}
