import {
  buildLessonBundleObservacoes,
  getBundleQuantityForTool,
  normalizeLessonBundleTools,
} from "@/lib/aula-completa/lesson-bundle-config";
import {
  hasMaterialTopicInput,
  resolveMaterialDisplayTema,
} from "@/lib/educacao/material-form-config";
import { BUNDLE_SERVER_DEADLINE_MS } from "@/lib/pro/generation-timeout";
import type { PlanifyToolId } from "@/lib/pro/planifyTools";
import type { MaterialAIOutput } from "@/types/ai";
import { logOperationalEvent } from "../telemetry/operational-telemetry";
import { generatePlanifyMaterial } from "./material-generation-orchestrator";
import type { MaterialEngineInput } from "./material-engine-types";

export type LessonBundleItemResult = {
  toolId: PlanifyToolId;
  ok: boolean;
  html?: string;
  estrutura?: MaterialAIOutput;
  alertas?: string[];
  pipeline?: string;
  qualityScore?: number;
  qualityIssues?: string[];
  materialId?: string | null;
  error?: string;
};

export type LessonBundleInput = MaterialEngineInput & {
  bundleTools?: PlanifyToolId[];
};

function labelFromOutput(toolId: PlanifyToolId, estrutura: MaterialAIOutput | undefined): string {
  const titulo = estrutura?.titulo?.trim();
  return titulo ? `${toolId}: ${titulo}` : toolId;
}

export async function generateLessonBundle(
  input: LessonBundleInput,
  options?: {
    onProgress?: (payload: {
      index: number;
      total: number;
      toolId: PlanifyToolId;
      status: "started" | "done" | "failed";
    }) => void;
    onItem?: (item: LessonBundleItemResult) => void;
    persistItem?: (payload: {
      toolId: PlanifyToolId;
      html: string;
      estrutura: MaterialAIOutput;
      pipeline: string;
      qualityScore?: number;
    }) => Promise<string | null>;
  },
): Promise<
  | { ok: false; status: number; message: string }
  | { ok: true; items: LessonBundleItemResult[]; tema: string }
> {
  const conteudo = String(input.conteudo || "").trim();
  const temaRaw = String(input.tema || input.temaCentral || "").trim();
  if (!hasMaterialTopicInput(temaRaw, conteudo)) {
    return {
      ok: false,
      status: 400,
      message: "Informe o conteúdo ou o tema da aula.",
    };
  }
  const tema = resolveMaterialDisplayTema(temaRaw, conteudo);

  const { toolIds, invalidToolIds } = normalizeLessonBundleTools(input.bundleTools);
  if (invalidToolIds.length) {
    return {
      ok: false,
      status: 400,
      message: `Ferramenta(s) inválida(s) para Aula Completa: ${invalidToolIds.join(", ")}.`,
    };
  }

  const items: LessonBundleItemResult[] = [];
  const completedLabels: string[] = [];
  const bundleStartedAt = Date.now();
  const isPastBundleDeadline = () =>
    Date.now() - bundleStartedAt > BUNDLE_SERVER_DEADLINE_MS;

  for (let index = 0; index < toolIds.length; index += 1) {
    if (isPastBundleDeadline()) {
      for (let skipIndex = index; skipIndex < toolIds.length; skipIndex += 1) {
        const skippedToolId = toolIds[skipIndex];
        const skipped: LessonBundleItemResult = {
          toolId: skippedToolId,
          ok: false,
          error:
            "Tempo do pacote esgotado — os materiais anteriores foram entregues. Regenere este item individualmente.",
        };
        items.push(skipped);
        options?.onItem?.(skipped);
        options?.onProgress?.({
          index: skipIndex,
          total: toolIds.length,
          toolId: skippedToolId,
          status: "failed",
        });
      }
      break;
    }

    const toolId = toolIds[index];
    options?.onProgress?.({
      index,
      total: toolIds.length,
      toolId,
      status: "started",
    });

    const observacoes = buildLessonBundleObservacoes({
      baseObservacoes: input.observacoes,
      tema,
      objetivo: input.objetivo || input.objetivos,
      completedLabels,
    });

    const bundleQuantity = getBundleQuantityForTool(toolId);

    const payload: MaterialEngineInput = {
      ...input,
      tipoMaterial: toolId,
      tipo: toolId,
      tema,
      conteudo,
      observacoes,
      ...(bundleQuantity ? { quantidade: bundleQuantity } : {}),
      idempotencyKey: crypto.randomUUID(),
    };

    try {
      const result = await generatePlanifyMaterial(payload);

      if (!result.ok) {
        logOperationalEvent({
          eventType: "bundle_item_failed",
          toolTipo: toolId,
          ok: false,
          errorCode: String(result.status || "generation_failed"),
          metadata: { message: result.message },
        });
        const failedItem: LessonBundleItemResult = {
          toolId,
          ok: false,
          error: result.message,
        };
        items.push(failedItem);
        options?.onItem?.(failedItem);
        options?.onProgress?.({
          index,
          total: toolIds.length,
          toolId,
          status: "failed",
        });
        continue;
      }

      const estrutura = result.data.estrutura as MaterialAIOutput | undefined;
      const pipeline =
        "pipeline" in result.data ? String(result.data.pipeline || "ai") : "engine";
      let materialId: string | null = null;

      if (options?.persistItem && estrutura) {
        materialId = await options.persistItem({
          toolId,
          html: result.data.html,
          estrutura,
          pipeline,
          qualityScore:
            typeof result.data.qualityScore === "number"
              ? result.data.qualityScore
              : undefined,
        });
      }

      completedLabels.push(labelFromOutput(toolId, estrutura));

      const successItem: LessonBundleItemResult = {
        toolId,
        ok: true,
        html: result.data.html,
        estrutura,
        alertas: result.data.alertas,
        pipeline,
        qualityScore: result.data.qualityScore,
        qualityIssues: result.data.qualityIssues,
        materialId,
      };
      items.push(successItem);
      options?.onItem?.(successItem);

      options?.onProgress?.({
        index,
        total: toolIds.length,
        toolId,
        status: "done",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Falha ao gerar material do pacote.";
      logOperationalEvent({
        eventType: "bundle_item_failed",
        toolTipo: toolId,
        ok: false,
        errorCode: "exception",
        metadata: { message },
      });
      const failedItem: LessonBundleItemResult = { toolId, ok: false, error: message };
      items.push(failedItem);
      options?.onItem?.(failedItem);
      options?.onProgress?.({
        index,
        total: toolIds.length,
        toolId,
        status: "failed",
      });
    }
  }

  const successCount = items.filter((item) => item.ok).length;
  if (successCount === 0) {
    return {
      ok: false,
      status: 502,
      message: "Não foi possível gerar nenhum material do pacote. Tente novamente.",
    };
  }

  return { ok: true, items, tema };
}
