import { NextRequest, NextResponse } from "next/server";
import { requireApiAuthenticated } from "@/server/auth/api-access";
import { requireSchoolDashboardAccess } from "@/server/schools/school-access";
import { revokeSchoolInvite } from "@/server/schools/school-license";
import { ensurePrimarySchoolIdForUser } from "@/server/schools/school-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireApiAuthenticated(request);
  if (!auth.ok) return auth.response;

  const userId = auth.access.user?.id;
  if (!userId) {
    return NextResponse.json(
      { success: false, error: { message: "Usuário não identificado." } },
      { status: 401 },
    );
  }

  const schoolId = await ensurePrimarySchoolIdForUser(userId);
  if (!schoolId) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            "Nenhuma escola vinculada ao gestor. Peça ao suporte para associar sua conta.",
        },
      },
      { status: 400 },
    );
  }

  const access = await requireSchoolDashboardAccess(userId, schoolId);
  if (!access.ok) {
    return NextResponse.json(
      { success: false, error: { message: access.message } },
      { status: 403 },
    );
  }

  const { id: inviteId } = await context.params;

  if (!inviteId?.trim()) {
    return NextResponse.json(
      { success: false, error: { message: "Convite não informado." } },
      { status: 400 },
    );
  }

  try {
    await revokeSchoolInvite(schoolId, inviteId);
    return NextResponse.json({
      success: true,
      message: "Convite cancelado com sucesso.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao cancelar convite.";
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 500 },
    );
  }
}
