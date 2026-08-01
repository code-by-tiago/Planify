import { NextRequest, NextResponse } from "next/server";
import { requireApiPremiumAccess } from "@/server/auth/api-access";
import {
  listTeacherClasses,
  upsertTeacherClass,
} from "@/server/schools/teacher-classes-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireApiPremiumAccess(request);
  if (!auth.ok) return auth.response;

  const userId = auth.access.user?.id;
  if (!userId) {
    return NextResponse.json(
      { success: false, error: { message: "Usuário não identificado." } },
      { status: 401 },
    );
  }

  try {
    const classes = await listTeacherClasses(userId);
    return NextResponse.json({ success: true, classes });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao carregar turmas.";
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireApiPremiumAccess(request);
  if (!auth.ok) return auth.response;

  const userId = auth.access.user?.id;
  if (!userId) {
    return NextResponse.json(
      { success: false, error: { message: "Usuário não identificado." } },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => null)) as { name?: string } | null;
  const name = String(body?.name || "").trim();

  if (!name) {
    return NextResponse.json(
      { success: false, error: { message: "Informe o nome da turma." } },
      { status: 400 },
    );
  }

  try {
    const schoolClass = await upsertTeacherClass(userId, name);
    return NextResponse.json({ success: true, class: schoolClass }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao salvar turma.";
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 500 },
    );
  }
}
