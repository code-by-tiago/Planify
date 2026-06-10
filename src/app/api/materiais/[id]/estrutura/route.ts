import { NextRequest, NextResponse } from "next/server";
import { requireApiPremiumAccess } from "@/server/auth/api-access";
import { getMaterialEstruturaForUser } from "@/server/materials/material-estrutura-service";

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
      { ok: false, message: "Usuário não autenticado." },
      { status: 401 },
    );
  }

  const { id } = await context.params;
  const materialId = String(id || "").trim();

  if (!materialId) {
    return NextResponse.json(
      { ok: false, message: "ID do material inválido." },
      { status: 400 },
    );
  }

  const result = await getMaterialEstruturaForUser({ userId, materialId });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, message: result.message },
      { status: result.status },
    );
  }

  return NextResponse.json({
    ok: true,
    estrutura: result.estrutura,
    meta: result.meta,
  });
}
