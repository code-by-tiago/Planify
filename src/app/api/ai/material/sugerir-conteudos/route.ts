import { NextRequest, NextResponse } from "next/server";
import { requireApiPremiumAccess } from "../../../../../server/auth/api-access";
import type { AIResponse, MaterialContentSuggestionInput, MaterialContentSuggestionOutput } from "../../../../../types/ai";
import { suggestMaterialContents } from "../../../../../server/ai/material-ai-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(code: string, message: string, status: number, details?: string) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
    },
    { status },
  );
}

export async function POST(request: NextRequest) {
  const auth = await requireApiPremiumAccess(request);
  if (!auth.ok) return auth.response;

  try {
    const body = (await request.json()) as MaterialContentSuggestionInput;
    const data = await suggestMaterialContents(body);

    return NextResponse.json(
      {
        success: true,
        data,
        warnings: data.alertas || [],
      } satisfies AIResponse<MaterialContentSuggestionOutput>,
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido ao sugerir conteúdos.";

    if (
      message.includes("Informe") ||
      message.includes("Selecione") ||
      message.includes("Envie") ||
      message.includes("Dados")
    ) {
      return errorResponse("invalid_request", message, 400);
    }

    if (/GEMINI_API_KEY|API key|chave/i.test(message)) {
      return errorResponse("gemini_config", message, 503, message);
    }

    return errorResponse("gemini_error", message, 502, message);
  }
}

export async function GET() {
  return NextResponse.json(
    {
      success: true,
      message: "API de sugestão inteligente de conteúdos ativa. Use POST.",
      endpoint: "/api/ai/material/sugerir-conteudos",
      metodo: "POST",
    },
    { status: 200 },
  );
}
