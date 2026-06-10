import { NextRequest, NextResponse } from "next/server";
import type { TeacherCorrectionProfile } from "@/types/correction";
import { requireApiPremiumAccess } from "@/server/auth/api-access";
import {
  getCorrectionProfile,
  upsertCorrectionProfile,
} from "@/server/correcao/correction-profile-service";

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

  const profile = await getCorrectionProfile(userId);

  return NextResponse.json({ ok: true, profile });
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
    | TeacherCorrectionProfile
    | null;

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { ok: false, message: "Perfil inválido." },
      { status: 400 },
    );
  }

  const profile = await upsertCorrectionProfile(userId, body);

  return NextResponse.json({ ok: true, profile });
}
