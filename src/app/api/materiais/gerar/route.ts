import { NextRequest, NextResponse } from "next/server";
import { generatePlanifyMaterial } from "../../../../server/materials/material-generation-orchestrator";
import type { MaterialEngineInput } from "../../../../server/materials/material-engine-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as MaterialEngineInput;
    const result = await generatePlanifyMaterial(payload);

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
      alertas: "alertas" in result.data ? result.data.alertas : [],
      pipeline: "pipeline" in result.data ? result.data.pipeline : "engine",
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
