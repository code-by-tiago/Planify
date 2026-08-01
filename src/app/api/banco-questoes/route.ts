import { NextRequest, NextResponse } from "next/server";
import {
  listCommunityQuestions,
  listSchoolQuestions,
  listUserQuestions,
  resolveSchoolIdForUser,
} from "@/server/banco-questoes/question-bank-db-service";
import { requireApiPremiumAccess } from "@/server/auth/api-access";

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

  const source = request.nextUrl.searchParams.get("source") || "mine";
  const componente = request.nextUrl.searchParams.get("componente") || undefined;
  const anoSerie = request.nextUrl.searchParams.get("anoSerie") || undefined;
  const query = request.nextUrl.searchParams.get("q") || undefined;
  const limit = Number(request.nextUrl.searchParams.get("limit") || "500");
  const offset = Number(request.nextUrl.searchParams.get("offset") || "0");

  const filter = { componente, anoSerie, query, limit, offset };

  if (source === "community") {
    const items = await listCommunityQuestions(filter);
    return NextResponse.json({ ok: true, items });
  }

  if (source === "school") {
    try {
      const schoolIdParam = request.nextUrl.searchParams.get("schoolId");
      const schoolId = await resolveSchoolIdForUser(userId, schoolIdParam);
      const items = await listSchoolQuestions(schoolId, filter);
      return NextResponse.json({ ok: true, items });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Escola não disponível.";
      return NextResponse.json({ ok: false, message }, { status: 403 });
    }
  }

  const items = await listUserQuestions(userId, filter);
  return NextResponse.json({ ok: true, items });
}
