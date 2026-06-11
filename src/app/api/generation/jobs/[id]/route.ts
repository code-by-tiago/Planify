import { NextRequest, NextResponse } from "next/server";
import { requireApiPremiumAccess } from "@/server/auth/api-access";
import { getGenerationJobForUser } from "@/server/generation/generation-job-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiPremiumAccess(request);
  if (!auth.ok) return auth.response;

  const userId = auth.access.user?.id;
  if (!userId) {
    return NextResponse.json(
      { ok: false, message: "Autenticação necessária." },
      { status: 401 },
    );
  }

  const { id } = await context.params;
  const job = await getGenerationJobForUser(id, userId);

  if (!job) {
    return NextResponse.json(
      { ok: false, message: "Job não encontrado." },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, job });
}
