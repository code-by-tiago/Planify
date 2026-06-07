import { NextRequest, NextResponse } from "next/server";
import { requireApiAuthenticated } from "@/server/auth/api-access";
import {
  getPrimarySchoolIdForUser,
  requireSchoolDashboardAccess,
} from "@/server/schools/school-access";
import { inviteTeacherToSchool } from "@/server/schools/school-invite-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseInviteEmail(body: { email?: string; email_professor?: string } | null): string {
  return String(body?.email || body?.email_professor || "").trim();
}

export async function POST(request: NextRequest) {
  const auth = await requireApiAuthenticated(request);
  if (!auth.ok) return auth.response;

  const userId = auth.access.user?.id;
  if (!userId) {
    return NextResponse.json(
      { success: false, error: { message: "Usuário não identificado." } },
      { status: 401 },
    );
  }

  const schoolId = await getPrimarySchoolIdForUser(userId);
  if (!schoolId) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            "Nenhuma escola vinculada ao gestor. Configure a escola antes de convidar professores.",
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

  const body = (await request.json().catch(() => null)) as {
    email?: string;
    email_professor?: string;
  } | null;

  const email = parseInviteEmail(body);

  if (!email) {
    return NextResponse.json(
      { success: false, error: { message: "Informe o e-mail do professor." } },
      { status: 400 },
    );
  }

  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json(
      { success: false, error: { message: "Informe um e-mail válido." } },
      { status: 400 },
    );
  }

  try {
    const result = await inviteTeacherToSchool(schoolId, email, userId);

    return NextResponse.json(
      {
        success: true,
        schoolId,
        result,
      },
      { status: result.status === "pending" ? 201 : 200 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao convidar professor.";
    const status = message.includes("já existe") ? 409 : 500;

    return NextResponse.json(
      { success: false, error: { message } },
      { status },
    );
  }
}
