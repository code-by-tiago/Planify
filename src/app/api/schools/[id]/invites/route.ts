import { NextRequest, NextResponse } from "next/server";
import { requireApiPremiumAccess } from "@/server/auth/api-access";
import { requireSchoolDirector } from "@/server/schools/school-access";
import { inviteTeacherToSchool } from "@/server/schools/school-invite-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireApiPremiumAccess(request);
  if (!auth.ok) return auth.response;

  const userId = auth.access.user?.id;
  if (!userId) {
    return NextResponse.json(
      { success: false, error: { message: "Usuário não identificado." } },
      { status: 401 },
    );
  }

  const { id: schoolId } = await context.params;
  const access = await requireSchoolDirector(userId, schoolId);

  if (!access.ok) {
    return NextResponse.json(
      { success: false, error: { message: access.message } },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as { email?: string } | null;

  if (!body?.email?.trim()) {
    return NextResponse.json(
      { success: false, error: { message: "Informe o e-mail do professor." } },
      { status: 400 },
    );
  }

  try {
    const result = await inviteTeacherToSchool(
      schoolId,
      body.email.trim(),
      userId,
    );

    return NextResponse.json({ success: true, result }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao convidar professor.";
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 500 },
    );
  }
}
