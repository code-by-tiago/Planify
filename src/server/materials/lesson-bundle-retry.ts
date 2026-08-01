import {
  buildLessonBundleObservacoes,
} from "@/lib/aula-completa/lesson-bundle-config";
import {
  hasMaterialTopicInput,
  resolveMaterialDisplayTema,
} from "@/lib/educacao/material-form-config";
import type { PlanifyToolId } from "@/lib/pro/planifyTools";
import type { MaterialAIOutput } from "@/types/ai";
import { generatePlanifyMaterial } from "./material-generation-orchestrator";
import type {
  LessonBundleInput,
  LessonBundleItemResult,
} from "./lesson-bundle-orchestrator";

function labelFromOutput(
  toolId: PlanifyToolId,
  estrutura: MaterialAIOutput | undefined,
): string {
  const titulo = estrutura?.titulo?.trim();
  return titulo ? `${toolId}: ${titulo}` : toolId;
}

export async function regenerateLessonBundleItem(
  input: LessonBundleInput,
  options: {
    toolId: PlanifyToolId;
    completedItems: LessonBundleItemResult[];
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
  | { ok: true; item: LessonBundleItemResult }
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

  const toolId = options.toolId;
  const completedLabels = options.completedItems
    .filter((item) => item.ok)
    .map((item) => labelFromOutput(item.toolId, item.estrutura));

  const observacoes = buildLessonBundleObservacoes({
    baseObservacoes: input.observacoes,
    tema,
    objetivo: input.objetivo || input.objetivos,
    completedLabels,
  });

  const payload = {
    ...input,
    tipoMaterial: toolId,
    tipo: toolId,
    tema,
    conteudo,
    observacoes,
    idempotencyKey: crypto.randomUUID(),
  };

  try {
    const result = await generatePlanifyMaterial(payload);

    if (!result.ok) {
      return {
        ok: true,
        item: { toolId, ok: false, error: result.message },
      };
    }

    const estrutura = result.data.estrutura as MaterialAIOutput | undefined;
    const pipeline =
      "pipeline" in result.data ? String(result.data.pipeline || "ai") : "engine";
    let materialId: string | null = null;

    if (options.persistItem && estrutura) {
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

    return {
      ok: true,
      item: {
        toolId,
        ok: true,
        html: result.data.html,
        estrutura,
        alertas: result.data.alertas,
        pipeline,
        qualityScore: result.data.qualityScore,
        qualityIssues: result.data.qualityIssues,
        materialId,
      },
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Falha ao regenerar material do pacote.";
    return {
      ok: true,
      item: { toolId, ok: false, error: message },
    };
  }
}
