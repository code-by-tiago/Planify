import type { MaterialEngineInput, MaterialEngineResponse } from "./material-engine-types";
import { normalizeMaterialEngineRequest } from "./material-engine-validation";
import { enrichSlidesWithImages } from "./slide-image-resolver";
import { renderMaterialAIOutputToHtml } from "./material-ai-html-renderer";
import type { MaterialAIOutput } from "@/types/ai";

type SlideItem = {
  imagePrompt?: string;
  imageUrl?: string;
  imageAlt?: string;
  layout?: string;
  title?: string;
};

export async function regenerateFailedSlideImages(
  input: MaterialEngineInput,
  estrutura: MaterialEngineResponse,
  options?: {
    onProgress?: (done: number, total: number) => void;
  },
): Promise<{ html: string; estrutura: MaterialEngineResponse; imagesResolved: number }> {
  const request = normalizeMaterialEngineRequest(input);
  const slides = (estrutura.slides ?? []) as SlideItem[];

  const failedIndexes = slides
    .map((slide, index) => ({ slide, index }))
    .filter(
      ({ slide }) =>
        slide.layout !== "fechamento" &&
        !slide.imageUrl?.trim() &&
        Boolean(slide.imagePrompt?.trim() || slide.title?.trim()),
    );

  if (!failedIndexes.length) {
    const html = renderMaterialAIOutputToHtml(
      estrutura as unknown as MaterialAIOutput,
      request,
    );
    return { html, estrutura, imagesResolved: 0 };
  }

  const toEnrich = failedIndexes.map(({ slide }) => slide);

  await enrichSlidesWithImages(toEnrich, {
    tema: request.tema,
    componente: request.componenteCurricular,
  });

  let done = 0;
  for (const { slide } of failedIndexes) {
    done += slide.imageUrl?.trim() ? 1 : 0;
    options?.onProgress?.(done, failedIndexes.length);
  }

  const html = renderMaterialAIOutputToHtml(
    estrutura as unknown as MaterialAIOutput,
    request,
  );
  return { html, estrutura, imagesResolved: done };
}
