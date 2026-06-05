import { NextRequest, NextResponse } from "next/server";
import { generatePlanningWithAI } from "../../../../server/planejamentos/planning-ai-service";
import { validatePlanningPayload } from "../../../../server/planejamentos/planning-validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const validationError = validatePlanningPayload(payload);

    if (validationError) {
      return NextResponse.json(
        {
          success: false,
          error: { message: validationError },
        },
        { status: 400 },
      );
    }

    const result = await generatePlanningWithAI(payload);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Não foi possível gerar o planejamento com IA.",
        },
      },
      { status: 500 },
    );
  }
}
