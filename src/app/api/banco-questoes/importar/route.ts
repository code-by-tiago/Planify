import { NextRequest, NextResponse } from "next/server";
import { extractQuestionsFromMaterialOutput } from "@/lib/banco-questoes/question-bank-extract";
import { requireApiPremiumAccess } from "@/server/auth/api-access";
import { upsertUserQuestion } from "@/server/banco-questoes/question-bank-db-service";
import { getMaterialEstruturaForUser } from "@/server/materials/material-estrutura-service";
import { logOperationalEvent } from "@/server/telemetry/operational-telemetry";
import type { QuestionBankItem } from "@/types/question-bank";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ImportBody = {
  materialIds?: string[];
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

  const body = (await request.json().catch(() => null)) as ImportBody | null;
  const materialIds = Array.isArray(body?.materialIds)
    ? body.materialIds.map((id) => String(id || "").trim()).filter(Boolean)
    : [];

  if (!materialIds.length) {
    return NextResponse.json(
      { ok: false, message: "Informe ao menos um material para importar." },
      { status: 400 },
    );
  }

  const items: QuestionBankItem[] = [];
  let duplicates = 0;

  for (const materialId of materialIds) {
    const result = await getMaterialEstruturaForUser({ userId, materialId });
    if (!result.ok || !result.estrutura?.questoes?.length) continue;

    const extracted = extractQuestionsFromMaterialOutput(result.estrutura, {
      componente: result.meta.discipline || undefined,
      sourceTitle: result.meta.title,
      sourceType: result.meta.tipo,
      bnccCodigos: result.meta.bncc_skill_codes,
      tags: ["importado-servidor"],
    });

    for (const question of extracted) {
      const { item, duplicate } = await upsertUserQuestion(userId, question);
      items.push(item);
      if (duplicate) duplicates += 1;
    }
  }

  const imported = items.length - duplicates;

  if (imported === 0) {
    logOperationalEvent({
      eventType: "question_import_zero",
      toolTipo: "banco-import",
      ok: false,
      errorCode: "zero_imported",
      metadata: {
        materialIds,
        duplicates,
        candidates: items.length,
      },
    });
  }

  return NextResponse.json({
    ok: true,
    imported,
    duplicates,
    items,
  });
}
