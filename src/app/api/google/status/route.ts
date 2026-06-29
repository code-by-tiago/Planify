import { NextRequest, NextResponse } from "next/server";
import { getGoogleConfigStatus } from "../../../../server/google/google-oauth";
import { resolvePlanifyUserFromRequest } from "../../../../server/google/google-auth";
import { resolveFormsScopeGrantedForUser } from "../../../../server/google/google-forms-scope";
import { getGoogleTokensForUser } from "../../../../server/google/google-token-store";
import {
  GOOGLE_CLASSROOM_REQUIRED_SCOPES,
  hasRequiredGoogleClassroomScopes,
  resolveMissingGoogleScopes,
} from "../../../../server/google/google-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  const config = getGoogleConfigStatus();
  const user = await resolvePlanifyUserFromRequest(_request);

  let connected = false;
  let googleEmail: string | null = null;
  let formsScopeGranted = false;
  let classroomScopeGranted = false;
  let missingClassroomScopes: string[] = [];

  if (user) {
    const tokens = await getGoogleTokensForUser(user.id).catch(() => null);
    connected = Boolean(tokens?.refreshToken);
    googleEmail = tokens?.googleEmail || null;
    classroomScopeGranted =
      connected && hasRequiredGoogleClassroomScopes(tokens?.scopes || []);
    missingClassroomScopes = connected
      ? resolveMissingGoogleScopes(
          tokens?.scopes || [],
          GOOGLE_CLASSROOM_REQUIRED_SCOPES,
        )
      : [];

    const scopeResult = await resolveFormsScopeGrantedForUser(user.id).catch(() => ({
      formsScopeGranted: false,
      dbGranted: false,
      tokenGranted: false,
    }));
    formsScopeGranted = scopeResult.formsScopeGranted;
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
    classroomScopeGranted,
    missingClassroomScopes,
  });
}
