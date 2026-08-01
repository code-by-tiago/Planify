import { NextRequest, NextResponse } from "next/server";
import { requireApiPremiumAccess } from "@/server/auth/api-access";
import { getUserSchoolContext } from "@/server/schools/school-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireApiPremiumAccess(request);
  if (!auth.ok) return auth.response;

  const userId = auth.access.user?.id;
  if (!userId) {
    return NextResponse.json(
      { success: false, error: { message: "Usuário não identificado." } },
      { status: 401 },
    );
  }

  try {
    const context = await getUserSchoolContext(userId);
    return NextResponse.json({ success: true, ...context });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao carregar escola.";
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 500 },
    );
  }
}
