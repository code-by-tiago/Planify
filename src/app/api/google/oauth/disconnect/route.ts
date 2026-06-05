import { NextRequest, NextResponse } from "next/server";
import { resolvePlanifyUserFromRequest } from "../../../../../server/google/google-auth";
import { deleteGoogleTokensForUser } from "../../../../../server/google/google-token-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const user = await resolvePlanifyUserFromRequest(request);

  if (!user) {
    return NextResponse.json(
      { success: false, error: { message: "Faça login no Planify." } },
      { status: 401 },
    );
  }

  await deleteGoogleTokensForUser(user.id);

  return NextResponse.json({ success: true });
}
