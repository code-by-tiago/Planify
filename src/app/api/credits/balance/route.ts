import { NextRequest, NextResponse } from "next/server";
import { resolvePlanifyUserFromRequest } from "../../../../server/google/google-auth";
import { getCreditWallet } from "../../../../server/credits/credit-service";
import {
  resolveUserBillingPlanKey,
  syncCreditWalletFromSubscription,
} from "../../../../server/credits/credit-subscription-sync";
import { getDailyGenerationStatus } from "../../../../server/credits/daily-generation-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await resolvePlanifyUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ ok: true, wallet: null });
  }

  await syncCreditWalletFromSubscription({
    userId: user.id,
    email: user.email,
  });

  const wallet = await getCreditWallet(user.id);
  const planKey =
    wallet?.planKey ||
    (await resolveUserBillingPlanKey({
      userId: user.id,
      email: user.email,
    }));
  const tipo = request.nextUrl.searchParams.get("tipo") || undefined;
  const daily = await getDailyGenerationStatus({
    userId: user.id,
    tipo,
    email: user.email,
    planKey,
  });

  return NextResponse.json({ ok: true, wallet, daily });
}
