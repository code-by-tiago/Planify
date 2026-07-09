import { NextRequest, NextResponse } from "next/server";
import { requireApiPremiumAccess } from "@/server/auth/api-access";
import { resolvePlanifyUserFromRequest } from "@/server/google/google-auth";
import { getGoogleConfigStatus, getGooglePickerConfig } from "@/server/google/google-config";
import { getValidGoogleAccessToken } from "@/server/google/google-token-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Token de curta duração + config pública para o Google Picker.
 * Nunca expõe refresh_token.
 */
export async function GET(request: NextRequest) {
  const oauth = getGoogleConfigStatus();
  const picker = getGooglePickerConfig();

  if (!oauth.configured || !picker.configured) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            "Google Picker não configurado. Defina GOOGLE_CLIENT_ID e GOOGLE_API_KEY.",
        },
        missing: [...oauth.missing, ...picker.missing],
      },
      { status: 503 },
    );
  }

  const access = await requireApiPremiumAccess(request);
  if (!access.ok) return access.response;

  const user = await resolvePlanifyUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: { message: "Faça login e conecte sua conta Google." } },
      { status: 401 },
    );
  }

  try {
    const { accessToken, googleEmail } = await getValidGoogleAccessToken(user.id);
    return NextResponse.json({
      success: true,
      data: {
        accessToken,
        clientId: picker.clientId,
        apiKey: picker.apiKey,
        appId: picker.appId,
        googleEmail,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Conecte sua conta Google para anexar do Drive.",
        },
      },
      { status: 401 },
    );
  }
}
