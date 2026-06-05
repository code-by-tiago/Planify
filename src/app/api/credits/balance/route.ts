import { NextRequest, NextResponse } from "next/server";
import { resolvePlanifyUserFromRequest } from "../../../../server/google/google-auth";
import { getCreditWallet } from "../../../../server/credits/credit-service";
import { syncCreditWalletFromSubscription } from "../../../../server/credits/credit-subscription-sync";

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
  return NextResponse.json({ ok: true, wallet });
}
