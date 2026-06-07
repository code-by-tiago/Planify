import { NextRequest, NextResponse } from "next/server";
import type { InstitutionalPlanKey } from "@/lib/school/institutional-plan";
import {
  createAdminSchool,
  listAdminSchools,
  updateAdminSchoolLicense,
} from "../../../../server/admin/platform-admin-service";
import { requireOwnerApi } from "../../../../server/auth/owner-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const gate = await requireOwnerApi(request);
  if (!gate.ok) return gate.response;

  try {
    const schools = await listAdminSchools();
    return NextResponse.json({ success: true, schools });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao listar escolas.";
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 500 },
    );
  }
}

const VALID_PLANS = new Set<InstitutionalPlanKey>(["pequena", "media", "grande"]);

export async function PATCH(request: NextRequest) {
  const gate = await requireOwnerApi(request);
  if (!gate.ok) return gate.response;

  const body = (await request.json().catch(() => null)) as {
    id?: string;
    institutionalPlan?: InstitutionalPlanKey | null;
  } | null;

  const schoolId = String(body?.id || "").trim();
  if (!schoolId) {
    return NextResponse.json(
      { success: false, error: { message: "Informe o id da escola." } },
      { status: 400 },
    );
  }

  const plan = body?.institutionalPlan;
  if (plan !== null && plan !== undefined && !VALID_PLANS.has(plan)) {
    return NextResponse.json(
      { success: false, error: { message: "Plano institucional inválido." } },
      { status: 400 },
    );
  }

  try {
    const result = await updateAdminSchoolLicense(schoolId, plan ?? null);
    return NextResponse.json({ success: true, school: result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao atualizar licença.";
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 400 },
    );
  }
}

export async function POST(request: NextRequest) {
  const gate = await requireOwnerApi(request);
  if (!gate.ok) return gate.response;

  const body = (await request.json().catch(() => null)) as {
    name?: string;
    city?: string;
    state?: string;
  } | null;

  try {
    const school = await createAdminSchool({
      name: String(body?.name || ""),
      city: body?.city || null,
      state: body?.state || null,
    });

    return NextResponse.json({ success: true, school });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao criar escola.";
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 400 },
    );
  }
}
