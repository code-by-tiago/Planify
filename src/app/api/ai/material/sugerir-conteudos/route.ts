import { NextRequest, NextResponse } from "next/server";
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

    return errorResponse("gemini_error", "Não foi possível sugerir conteúdos agora.", 502, message);
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
