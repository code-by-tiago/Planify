import { NextRequest, NextResponse } from "next/server";
import { requireApiAuthenticated } from "@/server/auth/api-access";
import { requireSchoolDashboardAccess } from "@/server/schools/school-access";
import {
  ensurePrimarySchoolIdForUser,
  listSchoolMaterialsAudit,
} from "@/server/schools/school-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parsePeriod(period: string | null): { fromDate?: string; toDate?: string } {
  if (!period || period === "all") return {};

  const now = new Date();

  if (period === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { fromDate: start.toISOString() };
  }

  if (period === "quarter") {
    const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
    const start = new Date(now.getFullYear(), quarterStartMonth, 1);
    return { fromDate: start.toISOString() };
  }

  if (period === "year") {
    const start = new Date(now.getFullYear(), 0, 1);
    return { fromDate: start.toISOString() };
  }

  return {};
}

export async function GET(request: NextRequest) {
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

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period");
  const { fromDate, toDate } = parsePeriod(period);
  const limit = Number(searchParams.get("limit") || "100");
  const offset = Number(searchParams.get("offset") || "0");

  try {
    const materials = await listSchoolMaterialsAudit(schoolId, {
      userId: searchParams.get("professorId") || undefined,
      discipline: searchParams.get("discipline") || undefined,
      classId: searchParams.get("classId") || undefined,
      fromDate: searchParams.get("fromDate") || fromDate,
      toDate: searchParams.get("toDate") || toDate,
      limit: Number.isFinite(limit) ? limit : 100,
      offset: Number.isFinite(offset) ? offset : 0,
    });

    return NextResponse.json({ success: true, materials });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao listar materiais.";
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 500 },
    );
  }
}
