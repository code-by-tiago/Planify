import { NextRequest, NextResponse } from "next/server";
import { generateMaterialByEngine } from "../../../../server/materials/material-engine-service";
import type { MaterialEngineInput } from "../../../../server/materials/material-engine-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as MaterialEngineInput;
    const result = await generateMaterialByEngine(payload);

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: result.message,
        },
        { status: result.status },
      );
    }

    return NextResponse.json({
      ok: true,
      html: result.data.html,
      tipoMaterial: result.data.tipoMaterial,
      estrutura: result.data.estrutura,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro inesperado ao gerar material.";

    return NextResponse.json(
      {
        ok: false,
        message,
      },
      { status: 500 },
    );
  }
}
