import { NextRequest, NextResponse } from "next/server";
import {
  fetchPlatformSettings,
  updatePlatformSettings,
} from "../../../../server/admin/platform-settings-service";
import { requireOwnerApi } from "../../../../server/auth/owner-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.5-pro",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
] as const;

export async function GET(request: NextRequest) {
  const gate = await requireOwnerApi(request);
  if (!gate.ok) return gate.response;

  try {
    const settings = await fetchPlatformSettings();

    return NextResponse.json(
      {
        success: true,
        settings,
        allowedModels: ALLOWED_MODELS,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "settings_read_failed",
          message:
            error instanceof Error
              ? error.message
              : "Não foi possível ler configurações.",
        },
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const gate = await requireOwnerApi(request);
  if (!gate.ok) return gate.response;

  try {
    const body = (await request.json().catch(() => null)) as {
      registrationsEnabled?: boolean;
      defaultAiModel?: string;
    } | null;

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "invalid_body",
            message: "Corpo da requisição inválido.",
          },
        },
        { status: 400 },
      );
    }

    if (
      body.defaultAiModel &&
      !ALLOWED_MODELS.includes(
        body.defaultAiModel as (typeof ALLOWED_MODELS)[number],
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "invalid_model",
            message: "Modelo IA não permitido.",
          },
        },
        { status: 400 },
      );
    }

    const settings = await updatePlatformSettings({
      registrationsEnabled: body.registrationsEnabled,
      defaultAiModel: body.defaultAiModel,
    });

    return NextResponse.json({
      success: true,
      settings,
      allowedModels: ALLOWED_MODELS,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "settings_update_failed",
          message:
            error instanceof Error
              ? error.message
              : "Não foi possível salvar configurações.",
        },
      },
      { status: 500 },
    );
  }
}
