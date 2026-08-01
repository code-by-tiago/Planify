import type { GenerationStageEvent, GenerationStageId } from "./generation-job-types";

const STAGE_DEFS: Record<
  GenerationStageId,
  { message: string; progress: number }
> = {
  queued: { message: "Na fila…", progress: 4 },
  prepare: { message: "Preparando geração…", progress: 10 },
  context: { message: "Buscando contexto pedagógico…", progress: 22 },
  bank: { message: "Montando questões do banco…", progress: 38 },
  generate: { message: "Gerando conteúdo…", progress: 58 },
  quality: { message: "Validando qualidade…", progress: 74 },
  images: { message: "Resolvendo imagens…", progress: 86 },
  persist: { message: "Salvando material…", progress: 94 },
  done: { message: "Pronto!", progress: 100 },
};

export function buildStageEvent(
  stage: GenerationStageId,
  messageOverride?: string,
): GenerationStageEvent {
  const def = STAGE_DEFS[stage];
  return {
    stage,
    message: messageOverride?.trim() || def.message,
    progress: def.progress,
  };
}

export function stageMessageForTool(
  stage: GenerationStageId,
  toolLabel: string,
): GenerationStageEvent {
  const custom: Partial<Record<GenerationStageId, string>> = {
    generate: `Gerando ${toolLabel}…`,
    bank: `Buscando questões para ${toolLabel}…`,
  };
  return buildStageEvent(stage, custom[stage]);
}
