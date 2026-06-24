import { NextRequest, NextResponse } from "next/server";
import { getGoogleConfigStatus } from "../../../../server/google/google-oauth";
import { hasGoogleFormsScope } from "../../../../server/google/google-config";
import { resolvePlanifyUserFromRequest } from "../../../../server/google/google-auth";
import { getGoogleTokensForUser } from "../../../../server/google/google-token-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const config = getGoogleConfigStatus();
  const user = await resolvePlanifyUserFromRequest(request);

  let connected = false;
  let googleEmail: string | null = null;
  let formsScopeGranted = false;

  if (user) {
    const tokens = await getGoogleTokensForUser(user.id).catch(() => null);
    connected = Boolean(tokens?.refreshToken);
    googleEmail = tokens?.googleEmail || null;
    formsScopeGranted = hasGoogleFormsScope(tokens?.scopes || []);
  }

  return NextResponse.json({
    success: true,
    configured: config.configured,
    missingEnv: config.missing,
    authenticated: Boolean(user),
    connected,
    googleEmail,
    planifyEmail: user?.email ? String(user.email).trim().toLowerCase() : null,
    formsScopeGranted,
  });
}
