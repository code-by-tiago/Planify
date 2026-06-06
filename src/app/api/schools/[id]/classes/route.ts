import { NextRequest, NextResponse } from "next/server";
import { requireApiPremiumAccess } from "@/server/auth/api-access";
import { requireSchoolDirector } from "@/server/schools/school-access";
import {
  createSchoolClass,
  listSchoolClasses,
} from "@/server/schools/school-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
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

  try {
    const classes = await listSchoolClasses(schoolId);
    return NextResponse.json({ success: true, classes });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao listar turmas.";
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 500 },
    );
  }
}

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

  const body = (await request.json().catch(() => null)) as
    | {
        name?: string;
        gradeLevel?: string | null;
        year?: number | null;
        discipline?: string | null;
      }
    | null;

  if (!body?.name?.trim()) {
    return NextResponse.json(
      { success: false, error: { message: "Informe o nome da turma." } },
      { status: 400 },
    );
  }

  try {
    const schoolClass = await createSchoolClass(schoolId, {
      name: body.name,
      gradeLevel: body.gradeLevel,
      year: body.year,
      discipline: body.discipline,
    });

    return NextResponse.json({ success: true, class: schoolClass }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao criar turma.";
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 500 },
    );
  }
}
