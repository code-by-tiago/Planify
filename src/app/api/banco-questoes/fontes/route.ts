import { NextRequest, NextResponse } from "next/server";
import { requireApiPremiumAccess } from "@/server/auth/api-access";
import { listImportableQuestionSourcesForUser } from "@/server/materials/material-estrutura-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireApiPremiumAccess(request);
  if (!auth.ok) return auth.response;

  const userId = auth.access.user?.id;
  if (!userId) {
    return NextResponse.json(
      { ok: false, message: "Usuário não autenticado." },
      { status: 401 },
    );
  }

  const tipoParam = request.nextUrl.searchParams.get("tipo") || "";
  const tipos = tipoParam
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const limit = Number(request.nextUrl.searchParams.get("limit") || 50);

  const fontes = await listImportableQuestionSourcesForUser({
    userId,
    tipos: tipos.length ? tipos : undefined,
    limit: Number.isFinite(limit) ? limit : 50,
  });

  return NextResponse.json({ ok: true, fontes });
}
