import { NextRequest, NextResponse } from "next/server";
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
import { withOperationalCapture } from "@/server/telemetry/with-operational-capture";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function handlePost(
  request: NextRequest,
  _context: { params: Promise<Record<string, string>> },
) {
  const prepared = await prepareLessonBundleRequest(request);
  if (!prepared.ok) return prepared.response;

  const { user, payload, tipo, bundleCost, charge } = prepared;

  try {
    const result = await generateLessonBundle(payload, {
      persistItem: createLessonBundlePersistItem(user, payload),
    });

    if (!result.ok) {
      await refundLessonBundleCharges(user?.id, tipo, charge);

      return NextResponse.json(
        { ok: false, message: result.message },
        { status: result.status },
      );
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

    return NextResponse.json({
      ok: true,
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

    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

export const POST = withOperationalCapture(
  { eventType: "material_generation_failed", toolTipo: "aula-completa" },
  handlePost,
);
