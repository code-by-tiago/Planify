/**
 * Fachada legada — delega ao motor unificado (promptEngine.ts).
 * Mantida para compatibilidade com gemini-static-context e callers existentes.
 */

import { buildElevateQualityObservacoes } from "@/lib/materiais/material-quality-score";
import { resolveDisciplineTopicGuidance } from "@/lib/materiais/discipline-topic-seeds";
import type { MaterialEngineRequest, MaterialEngineType } from "./material-engine-types";
import { toPromptEngineInput } from "./material-layout-adapter";
import {
  buildPromptEngine,
  buildStaticRulesForType,
  buildSystemInstruction,
} from "./promptEngine";
import { assertKnownToolType } from "./validator";

export function buildMaterialEngineStaticRules(type: MaterialEngineType): string {
  return buildStaticRulesForType(assertKnownToolType(type));
}

export function buildMaterialEngineSystemInstruction(type: MaterialEngineType): string {
  return buildSystemInstruction(assertKnownToolType(type));
}

export function buildMaterialEnginePrompt(
  request: MaterialEngineRequest,
  extraBlocks = "",
): string {
  const { userPrompt } = buildPromptEngine(toPromptEngineInput(request));

  const discipline = resolveDisciplineTopicGuidance({
    tema: request.tema,
    componenteCurricular: request.componenteCurricular,
  });

  const disciplineBlock = discipline?.promptBlock
    ? `\n\n${discipline.promptBlock}`
    : "";

  const extra = extraBlocks.trim() ? `\n\n${extraBlocks.trim()}` : "";

  const elevateBlock =
    request.elevarQualidade || request.problemasQualidade?.length
      ? `\n\n${buildElevateQualityObservacoes(request.problemasQualidade ?? [])}`
      : "";

  return `${userPrompt}${disciplineBlock}${extra}${elevateBlock}`.trim();
}
