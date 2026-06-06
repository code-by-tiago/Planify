import { NextRequest, NextResponse } from "next/server";
import { requireApiAuthenticated } from "@/server/auth/api-access";
import { getTeacherBnccProgress } from "@/server/bncc/bncc-progress-service";
import { buildPlanifyAccessContext } from "@/lib/bncc/access";
import { resolveUserAccessProfile } from "@/server/auth/user-access-profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireApiAuthenticated(request);
  if (!auth.ok) return auth.response;

  const userId = auth.access.user?.id;
  if (!userId) {
    return NextResponse.json(
      { success: false, error: { message: "Faça login para continuar." } },
      { status: 401 },
    );
  }

  const accessProfile = await resolveUserAccessProfile(userId);
  const accessContext = buildPlanifyAccessContext({
    premium: auth.access.premium,
    planKey: auth.access.subscription?.planKey,
    isAdmin: auth.access.user?.isAdmin,
    profileRole: accessProfile.profileRole,
    schoolId: accessProfile.schoolId,
    schoolMembershipRole: accessProfile.schoolMembershipRole,
  });

  if (!accessContext.canViewBnccProgress) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Plano Pro necessário para acompanhar o progresso BNCC.",
          code: "paywall",
        },
      },
      { status: 403 },
    );
  }

  const { searchParams } = new URL(request.url);
  const classFilter =
    searchParams.get("classFilter") ||
    searchParams.get("classId") ||
    undefined;
  const discipline = searchParams.get("discipline") || undefined;

  try {
    const progress = await getTeacherBnccProgress(userId, {
      classFilter,
      discipline,
    });

    return NextResponse.json({ success: true, progress, access: accessContext });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao carregar progresso BNCC.";
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 500 },
    );
  }
}
