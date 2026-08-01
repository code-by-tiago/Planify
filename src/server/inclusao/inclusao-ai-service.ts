import { getModelTierForMaterialType } from "@/lib/ai/material-generation-policy";
import { INCLUSAO_GENERATION_TYPE } from "@/lib/inclusao/inclusao-config";
import type {
  InclusaoEducationLevel,
  InclusaoModeId,
  InclusaoNeedId,
} from "@/lib/inclusao/inclusao-config";
import { markdownToHtml } from "@/lib/inclusao/markdown-to-html";
import { generateGeminiText } from "../ai/gemini-client";
import {
  buildInclusaoPrompt,
  INCLUSAO_SYSTEM_INSTRUCTION,
} from "./inclusao-prompts";

export type InclusaoAiPayload = {
  modo: InclusaoModeId;
  necessidade: InclusaoNeedId;
  etapaEnsino: InclusaoEducationLevel;
  conteudo: string;
  observacoes?: string;
  classId?: string | null;
  className?: string | null;
  turma?: string | null;
  discipline?: string | null;
  disciplina?: string | null;
};

export type InclusaoAiResult = {
  ok: true;
  markdown: string;
  html: string;
  usedAI: boolean;
};

function validatePayload(payload: InclusaoAiPayload): string | null {
  if (!payload.modo) return "Selecione o modo de geração.";
  if (!payload.necessidade) return "Selecione a necessidade educacional.";
  if (!payload.etapaEnsino) return "Selecione a etapa de ensino.";

  const content = String(payload.conteudo || "").trim();
  if (payload.modo === "mediacao" && !content) {
    return null;
  }
  if (!content || content.length < 10) {
    return "Descreva o conteúdo ou as observações com pelo menos 10 caracteres.";
  }

  return null;
}

export async function generateInclusaoWithAI(
  payload: InclusaoAiPayload,
  options?: { userId?: string | null },
): Promise<
  | { ok: false; status: number; message: string }
  | InclusaoAiResult
> {
  const validationError = validatePayload(payload);
  if (validationError) {
    return { ok: false, status: 400, message: validationError };
  }

  const { enrichWithPedagogicalContext } = await import(
    "../pedagogical-cache/enrich-with-pedagogical-context"
  );
  const enrichedPayload = await enrichWithPedagogicalContext(
    payload,
    {
      tema: String(payload.conteudo || "").trim().slice(0, 200),
      disciplina: payload.disciplina || payload.discipline || undefined,
      etapa: payload.etapaEnsino,
      observacoes: payload.observacoes,
    },
    {
      userId: options?.userId ?? null,
      toolTipo: "inclusao",
      allowScrape: true,
    },
  );

  const prompt = buildInclusaoPrompt({
    mode: enrichedPayload.modo,
    need: enrichedPayload.necessidade,
    educationLevel: enrichedPayload.etapaEnsino,
    content: enrichedPayload.conteudo,
    observacoes: enrichedPayload.observacoes,
    turma: enrichedPayload.turma || enrichedPayload.className || undefined,
  });

  const tier = getModelTierForMaterialType(INCLUSAO_GENERATION_TYPE);

  try {
    const markdown = await generateGeminiText({
      systemInstruction: INCLUSAO_SYSTEM_INSTRUCTION,
      prompt,
      tier,
      temperature: 0.45,
      maxOutputTokens: 8192,
    });

    const trimmed = markdown.trim();
    if (!trimmed) {
      return {
        ok: false,
        status: 502,
        message: "A IA não retornou conteúdo. Tente novamente.",
      };
    }

    return {
      ok: true,
      markdown: trimmed,
      html: markdownToHtml(trimmed),
      usedAI: true,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível gerar a adaptação inclusiva.";

    return { ok: false, status: 502, message };
  }
}
