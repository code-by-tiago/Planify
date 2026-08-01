import { NextRequest, NextResponse } from "next/server";
import { requireApiPremiumAccess } from "@/server/auth/api-access";
import { requireSchoolDirector } from "@/server/schools/school-access";
import {
  createSchoolMember,
  listSchoolMembers,
} from "@/server/schools/school-service";
import type { SchoolMembershipRole } from "@/types/school";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const ALLOWED_ROLES = new Set<SchoolMembershipRole>([
  "director",
  "teacher",
  "coordinator",
]);

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
    const members = await listSchoolMembers(schoolId);
    return NextResponse.json({ success: true, members });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao listar membros.";
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
        userId?: string;
        role?: SchoolMembershipRole;
        status?: "active" | "inactive";
      }
    | null;

  if (!body?.userId?.trim()) {
    return NextResponse.json(
      { success: false, error: { message: "Informe o userId do membro." } },
      { status: 400 },
    );
  }

  if (!body.role || !ALLOWED_ROLES.has(body.role)) {
    return NextResponse.json(
      { success: false, error: { message: "Papel inválido." } },
      { status: 400 },
    );
  }

  try {
    const member = await createSchoolMember(schoolId, {
      userId: body.userId.trim(),
      role: body.role,
      status: body.status,
    });

    return NextResponse.json({ success: true, member }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao adicionar membro.";
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 500 },
    );
  }
}
