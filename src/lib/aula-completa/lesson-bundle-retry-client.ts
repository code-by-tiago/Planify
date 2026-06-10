import { planifyAuthenticatedFetch } from "@/lib/auth/authenticated-fetch";
import type { LessonBundleItem, LessonBundlePayload } from "@/lib/aula-completa/lesson-bundle-client";
import { LessonBundleError } from "@/lib/aula-completa/lesson-bundle-client";
import type { PlanifyToolId } from "@/lib/pro/planifyTools";

export type RegenerateBundleItemPayload = LessonBundlePayload & {
  bundleRetry: true;
  toolId: PlanifyToolId;
  completedItems: LessonBundleItem[];
};

export async function requestLessonBundleItemRetry(
  payload: RegenerateBundleItemPayload,
): Promise<{ item: LessonBundleItem; creditCost: number }> {
  const response = await planifyAuthenticatedFetch("/api/aula-completa/regenerar-item", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.ok) {
    throw new LessonBundleError(
      data?.message || "Não foi possível regenerar o item.",
      { code: data?.code, status: response.status },
    );
  }

  window.dispatchEvent(new Event("planify:credits-changed"));

  return {
    item: data.item as LessonBundleItem,
    creditCost: Number(data.creditCost || 0),
  };
}
