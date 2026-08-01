import { NextRequest, NextResponse } from "next/server";
import { assembleExamFromQuestionIds } from "@/server/materials/exam-bank-assembler";
import type { MaterialEngineInput } from "@/server/materials/material-engine-types";
import {
  normalizeMaterialEngineRequest,
  validateMaterialEngineRequest,
} from "@/server/materials/material-engine-validation";
import { requireApiPremiumAccess } from "@/server/auth/api-access";
import { persistGeneratedMaterialBestEffort } from "@/server/materials/persist-generated-material";
import { autoPublishExamToQuestionBank } from "@/server/banco-questoes/question-bank-auto-publish";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  payload?: MaterialEngineInput;
  questionIds?: string[];
};

export async function POST(request: NextRequest) {
  const auth = await requireApiPremiumAccess(request);
  if (!auth.ok) return auth.response;

  const userId = auth.access.user?.id;
  if (!userId) {
    return NextResponse.json(
      { ok: false, message: "Usuário não autenticado." },
      { status: 401 },
    );
  }

  try {
    const body = (await request.json().catch(() => null)) as Body | null;
    const payload = body?.payload;
    const questionIds = Array.isArray(body?.questionIds)
      ? body.questionIds.map(String).filter(Boolean)
      : [];

    if (!payload || !questionIds.length) {
      return NextResponse.json(
        { ok: false, message: "Informe payload e questionIds." },
        { status: 400 },
      );
    }

    const requestNorm = normalizeMaterialEngineRequest(payload);
    const errors = validateMaterialEngineRequest(requestNorm);
    if (errors.length) {
      return NextResponse.json({ ok: false, message: errors[0] }, { status: 400 });
    }

    if (
      requestNorm.tipoMaterial !== "lista" &&
      requestNorm.tipoMaterial !== "prova" &&
      requestNorm.tipoMaterial !== "atividade"
    ) {
      return NextResponse.json(
        {
          ok: false,
          message: "Montagem do banco disponível para lista, prova e atividade.",
        },
        { status: 400 },
      );
    }

    const assembled = await assembleExamFromQuestionIds(payload, questionIds);
    if (!assembled.ok) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Não foi possível montar com as questões selecionadas. Escolha outras ou use lista automática.",
        },
        { status: 404 },
      );
    }

    const questions = assembled.estrutura.exam?.questions ?? [];
    void autoPublishExamToQuestionBank({
      userId,
      engineInput: payload,
      questions,
      qualityScore: assembled.qualityScore,
      pipeline: assembled.pipeline,
    }).catch((error) => {
      console.warn("[banco-questoes/montar] auto-publish failed:", error);
    });

    const materialId = await persistGeneratedMaterialBestEffort({
      userId,
      surface: "material",
      tipo: requestNorm.tipoMaterial,
      classId: payload.classId || null,
      className: payload.className?.trim() || payload.turma?.trim() || null,
      discipline:
        payload.discipline?.trim() ||
        payload.componenteCurricular?.trim() ||
        payload.componente?.trim() ||
        null,
      contentHtml: assembled.html,
      pipeline: assembled.pipeline,
      qualityScore: assembled.qualityScore,
      payload: payload as Record<string, unknown>,
      result: {
        html: assembled.html,
        estrutura: assembled.estrutura,
        pipeline: assembled.pipeline,
        qualityScore: assembled.qualityScore,
        qualityIssues: assembled.qualityIssues,
        alertas: assembled.alertas,
      },
    });

    return NextResponse.json({
      ok: true,
      html: assembled.html,
      estrutura: assembled.estrutura,
      alertas: assembled.alertas ?? [],
      pipeline: assembled.pipeline,
      qualityScore: assembled.qualityScore,
      qualityIssues: assembled.qualityIssues,
      materialId,
      tipoMaterial: requestNorm.tipoMaterial,
    });
  } catch (error) {
    console.error("[banco-questoes/montar] unexpected failure:", error);
    return NextResponse.json(
      { ok: false, message: "Erro inesperado ao montar material do banco." },
      { status: 500 },
    );
  }
}
