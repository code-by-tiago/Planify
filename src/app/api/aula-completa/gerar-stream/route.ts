import { NextRequest } from "next/server";
import {
  createLessonBundlePersistItem,
  prepareLessonBundleRequest,
  refundLessonBundleCharges,
  resolveLessonBundleCreditCost,
} from "@/server/materials/lesson-bundle-api-shared";
import {
  bucketQualityScore,
  logGenerationComplete,
} from "@/server/telemetry/generation-telemetry";
import { generateLessonBundle } from "@/server/materials/lesson-bundle-orchestrator";
import type { BundleStreamEvent } from "@/lib/aula-completa/lesson-bundle-stream-types";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function encodeEvent(event: BundleStreamEvent): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(event)}\n`);
}

export async function POST(request: NextRequest) {
  const prepared = await prepareLessonBundleRequest(request);
  if (!prepared.ok) return prepared.response;

  const { user, payload, tipo, bundleCost, charge } = prepared;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: BundleStreamEvent) => {
        controller.enqueue(encodeEvent(event));
      };

      try {
        const result = await generateLessonBundle(payload, {
          persistItem: createLessonBundlePersistItem(user, payload),
          onProgress: (progress) => {
            emit({ type: "progress", ...progress });
          },
          onItem: (item) => {
            emit({ type: "item", item });
          },
        });

        if (!result.ok) {
          await refundLessonBundleCharges(user?.id, tipo, charge);
          emit({ type: "error", message: result.message });
          controller.close();
          return;
        }

        const successItems = result.items.filter((item) => item.ok);
        const avgQuality =
          successItems.reduce((acc, item) => acc + (item.qualityScore ?? 0), 0) /
          Math.max(1, successItems.length);

        logGenerationComplete({
          surface: "material",
          tipo,
          pipeline: "bundle",
          qualityScoreBucket: bucketQualityScore(avgQuality),
          elevarQualidade: false,
          usedAI: true,
          dailyQuotaConsumed: charge.chargedDeepDaily,
        });

        emit({
          type: "complete",
          items: result.items,
          tema: result.tema,
          creditCost: resolveLessonBundleCreditCost(charge, bundleCost, tipo),
        });
      } catch (error) {
        await refundLessonBundleCharges(user?.id, tipo, charge);
        const message =
          error instanceof Error
            ? error.message
            : "Erro inesperado ao gerar a aula completa.";
        emit({ type: "error", message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
    },
  });
}
