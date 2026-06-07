import { NextRequest, NextResponse } from "next/server";
import { requireApiAuthenticated } from "@/server/auth/api-access";
import { requireSchoolDashboardAccess } from "@/server/schools/school-access";
import { revokeSchoolTeacher } from "@/server/schools/school-license";
import { ensurePrimarySchoolIdForUser } from "@/server/schools/school-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ userId: string }>;
};

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireApiAuthenticated(request);
  if (!auth.ok) return auth.response;

  const currentUserId = auth.access.user?.id;
  if (!currentUserId) {
    return NextResponse.json(
      { success: false, error: { message: "Usuário não identificado." } },
      { status: 401 },
    );
  }

  const schoolId = await ensurePrimarySchoolIdForUser(currentUserId);
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

  const access = await requireSchoolDashboardAccess(currentUserId, schoolId);
  if (!access.ok) {
    return NextResponse.json(
      { success: false, error: { message: access.message } },
      { status: 403 },
    );
  }

  const { userId: teacherUserId } = await context.params;

  if (!teacherUserId?.trim()) {
    return NextResponse.json(
      { success: false, error: { message: "Professor não informado." } },
      { status: 400 },
    );
  }

  if (teacherUserId === currentUserId) {
    return NextResponse.json(
      { success: false, error: { message: "Você não pode revogar o próprio acesso." } },
      { status: 400 },
    );
  }

  try {
    await revokeSchoolTeacher(schoolId, teacherUserId);
    return NextResponse.json({
      success: true,
      message: "Licença do professor revogada com sucesso.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao revogar licença.";
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 500 },
    );
  }
}
