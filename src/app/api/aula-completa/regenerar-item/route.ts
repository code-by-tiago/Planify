import { NextRequest, NextResponse } from "next/server";
import { LESSON_BUNDLE_GENERATION_TYPE } from "@/lib/aula-completa/lesson-bundle-config";
import { createLessonBundlePersistItem } from "@/server/materials/lesson-bundle-api-shared";
import {
  getCreditCost,
  refundCredits,
  spendCredits,
} from "@/server/credits/credit-service";
import { regenerateLessonBundleItem } from "@/server/materials/lesson-bundle-retry";
import type { LessonBundleInput } from "@/server/materials/lesson-bundle-orchestrator";
import type { LessonBundleItemResult } from "@/server/materials/lesson-bundle-orchestrator";
import type { PlanifyToolId } from "@/lib/pro/planifyTools";
import { requireApiPremiumAccess } from "@/server/auth/api-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type RegenerarItemBody = LessonBundleInput & {
  bundleRetry?: boolean;
  toolId: PlanifyToolId;
  completedItems: LessonBundleItemResult[];
};

export async function POST(request: NextRequest) {
  const auth = await requireApiPremiumAccess(request);
  if (!auth.ok) return auth.response;

  const user = auth.access.user;
  const body = (await request.json().catch(() => null)) as RegenerarItemBody | null;

  if (!body?.toolId) {
    return NextResponse.json(
      { ok: false, message: "Requisição inválida." },
      { status: 400 },
    );
  }

  const tipo = LESSON_BUNDLE_GENERATION_TYPE;
  const retryCost = Math.max(1, Math.round(getCreditCost(body.toolId) * 0.5));

  let chargedCost = 0;

  if (user?.id) {
    const spend = await spendCredits(user.id, tipo, user.email, retryCost);

    if (spend.status === "insufficient") {
      return NextResponse.json(
        {
          ok: false,
          code: "insufficient_credits",
          message:
            "Você não tem créditos suficientes para regenerar este item. Faça upgrade do plano para continuar.",
          balance: spend.balance,
          cost: spend.cost,
        },
        { status: 402 },
      );
    }

    if (spend.status === "ok") {
      chargedCost = spend.cost;
    }
  }

  try {
    const result = await regenerateLessonBundleItem(body, {
      toolId: body.toolId,
      completedItems: body.completedItems ?? [],
      persistItem: createLessonBundlePersistItem(
        user?.id ? { id: user.id, email: user.email } : null,
        body,
      ),
    });

    if (!result.ok) {
      if (user?.id && chargedCost > 0) {
        await refundCredits(user.id, chargedCost, tipo);
      }
      return NextResponse.json(
        { ok: false, message: result.message },
        { status: result.status },
      );
    }

    if (!result.item.ok && user?.id && chargedCost > 0) {
      await refundCredits(user.id, chargedCost, tipo);
    }

    return NextResponse.json({
      ok: true,
      item: result.item,
      creditCost: chargedCost || retryCost,
    });
  } catch (error) {
    if (user?.id && chargedCost > 0) {
      await refundCredits(user.id, chargedCost, tipo);
    }

    const message =
      error instanceof Error
        ? error.message
        : "Erro inesperado ao regenerar o item.";

    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
