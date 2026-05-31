import { NextRequest, NextResponse } from "next/server";
import type { AIResponse, MaterialAIInput, MaterialAIOutput } from "../../../../types/ai";
import { generateMaterialWithAI } from "../../../../server/ai/material-ai-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: string,
) {
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
    const body = (await request.json()) as MaterialAIInput;

    const data = await generateMaterialWithAI(body);

    return NextResponse.json(
      {
        success: true,
        data,
        warnings: data.alertas ?? [],
      } satisfies AIResponse<MaterialAIOutput>,
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido ao gerar material com IA.";

    if (message.includes("GEMINI_API_KEY")) {
      return errorResponse(
        "missing_api_key",
        "A chave GEMINI_API_KEY não está configurada no servidor.",
        500,
        message,
      );
    }

    if (
      message.includes("Informe") ||
      message.includes("Selecione") ||
      message.includes("Envie") ||
      message.includes("Dados")
    ) {
      return errorResponse("invalid_request", message, 400);
    }

    if (message.includes("JSON inválido")) {
      return errorResponse(
        "invalid_json",
        "A IA retornou uma resposta fora do formato esperado. Tente novamente.",
        502,
        message,
      );
    }

    return errorResponse(
      "gemini_error",
      "Não foi possível gerar o material com IA agora.",
      502,
      message,
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      success: true,
      message: "API de materiais didáticos com Gemini ativa. Use POST para gerar.",
      endpoint: "/api/ai/material",
      metodo: "POST",
    },
    { status: 200 },
  );
}
