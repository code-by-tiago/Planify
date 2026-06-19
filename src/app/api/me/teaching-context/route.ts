import { NextRequest, NextResponse } from "next/server";
import type { TeacherTeachingContext } from "@/types/teaching-context";
import { requireApiPremiumAccess } from "@/server/auth/api-access";
import {
  getTeachingContext,
  upsertTeachingContext,
} from "@/server/auth/teaching-context-service";

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

  const context = await getTeachingContext(userId);

  return NextResponse.json({ ok: true, context });
}

export async function PUT(request: NextRequest) {
  const auth = await requireApiPremiumAccess(request);
  if (!auth.ok) return auth.response;

  const userId = auth.access.user?.id;
  if (!userId) {
    return NextResponse.json(
      { ok: false, message: "Usuário não autenticado." },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | TeacherTeachingContext
    | null;

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { ok: false, message: "Contexto inválido." },
      { status: 400 },
    );
  }

  const context = await upsertTeachingContext(userId, body);

  return NextResponse.json({ ok: true, context });
}
