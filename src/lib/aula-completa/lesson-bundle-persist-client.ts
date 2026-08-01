import { extractQuestionsFromMaterialOutput } from "@/lib/banco-questoes/question-bank-extract";
import { upsertQuestionBankItem } from "@/lib/banco-questoes/question-bank-storage";
import type { LessonBundleItem } from "@/lib/aula-completa/lesson-bundle-client";
import { persistGeneratedMaterial } from "@/lib/materiais/material-editor-flow";
import { getPlanifyTool } from "@/lib/pro/planifyTools";

export type PersistBundleItemContext = {
  tema: string;
  componente: string;
  anoSerie: string;
  etapa: string;
};

export function persistBundleItemToHistory(
  item: LessonBundleItem,
  context: PersistBundleItemContext,
): void {
  if (!item.ok || !item.html) return;

  const titulo = `${getPlanifyTool(item.toolId).shortTitle} — ${context.tema}`;
  persistGeneratedMaterial(item.html, titulo, {
    toolId: item.toolId,
    tema: context.tema,
    componente: context.componente,
    anoSerie: context.anoSerie,
    etapa: context.etapa,
    pipeline: item.pipeline ?? null,
    qualityScore: item.qualityScore ?? null,
    qualityIssues: item.qualityIssues ?? [],
    serverMaterialId: item.materialId ?? null,
    estrutura: item.estrutura ?? null,
  });

  maybeSaveQuestionsToBank(item, {
    ...context,
    sourceTitle: titulo,
  });
}

export function maybeSaveQuestionsToBank(
  item: LessonBundleItem,
  context: PersistBundleItemContext & { sourceTitle: string },
): void {
  if (item.toolId !== "prova" && item.toolId !== "lista") return;
  if (!item.estrutura) return;

  const now = new Date().toISOString();
  for (const question of extractQuestionsFromMaterialOutput(item.estrutura, {
    componente: context.componente,
    anoSerie: context.anoSerie,
    tema: context.tema,
    sourceTitle: context.sourceTitle,
    sourceType: item.toolId,
  })) {
    upsertQuestionBankItem({
      ...question,
      id: `qb-bundle-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: now,
      updatedAt: now,
    });
  }
}
