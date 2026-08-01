import { NextRequest, NextResponse } from "next/server";
import { requireApiPremiumAccess } from "@/server/auth/api-access";
import { requireSchoolDirector } from "@/server/schools/school-access";
import { listSchoolGeneratedMaterials } from "@/server/schools/school-service";
import type { GeneratedMaterialSurface } from "@/types/generated-material";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const SURFACES = new Set<GeneratedMaterialSurface>([
  "material",
  "planning",
  "inclusao",
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

  const { searchParams } = new URL(request.url);
  const surfaceParam = searchParams.get("surface");
  const surface =
    surfaceParam && SURFACES.has(surfaceParam as GeneratedMaterialSurface)
      ? (surfaceParam as GeneratedMaterialSurface)
      : undefined;

  const limit = Number(searchParams.get("limit") || "50");
  const offset = Number(searchParams.get("offset") || "0");

  try {
    const materials = await listSchoolGeneratedMaterials(schoolId, {
      bnccCode: searchParams.get("bnccCode") || undefined,
      surface,
      tipo: searchParams.get("tipo") || undefined,
      classId: searchParams.get("classId") || undefined,
      limit: Number.isFinite(limit) ? limit : 50,
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
