import { NextRequest, NextResponse } from "next/server";
import type {
  MaterialEngineInput,
  MaterialEngineResponse,
} from "@/server/materials/material-engine-types";
import { regenerateWeakExamQuestions } from "@/server/materials/exam-questions-retry";
import { requireApiPremiumAccess } from "@/server/auth/api-access";
import { withOperationalCapture } from "@/server/telemetry/with-operational-capture";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type RegenerarQuestoesBody = MaterialEngineInput & {
  estrutura: MaterialEngineResponse;
};

async function handlePost(
  request: NextRequest,
  _context: { params: Promise<Record<string, string>> },
) {
  const auth = await requireApiPremiumAccess(request);
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => null)) as RegenerarQuestoesBody | null;

  if (!body?.estrutura || !body.tipoMaterial) {
    return NextResponse.json(
      { ok: false, message: "Requisição inválida." },
      { status: 400 },
    );
  }

  const tipo = String(body.tipoMaterial || body.tipo || "");
  if (tipo !== "prova" && tipo !== "lista") {
    return NextResponse.json(
      { ok: false, message: "Retry parcial disponivel apenas para prova e lista." },
      { status: 400 },
    );
  }

  try {
    const result = await regenerateWeakExamQuestions(body, body.estrutura);

    return NextResponse.json({
      ok: true,
      html: result.html,
      estrutura: result.estrutura,
      questionsResolved: result.questionsResolved,
      qualityScore: result.qualityScore,
      qualityIssues: result.qualityIssues,
      creditCost: 0,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro inesperado ao regenerar questoes.";

    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

export const POST = withOperationalCapture(
  { eventType: "material_generation_failed", toolTipo: "exam-questions-retry" },
  handlePost,
);
