import { NextRequest, NextResponse } from "next/server";
import { requireApiPremiumAccess } from "@/server/auth/api-access";
import { fetchReferralSummary } from "@/server/referral/referral-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const gate = await requireApiPremiumAccess(request);
  if (!gate.ok) return gate.response;

  try {
    const userId = gate.access.user?.id;
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Usuário não encontrado.", code: "unauthorized" },
        },
        { status: 401 },
      );
    }

    const summary = await fetchReferralSummary(userId);

    return NextResponse.json(
      {
        success: true,
        referral: summary,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Não foi possível carregar indicações.",
          code: "referral_read_failed",
        },
      },
      { status: 500 },
    );
  }
}
