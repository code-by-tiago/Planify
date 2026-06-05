import type { MaterialEngineResponse } from "./material-engine-types";

type SlideItem = NonNullable<MaterialEngineResponse["slides"]>[number];

/** Garante capa → conteúdo em ordem pedagógica → fechamento */
export function orderSlidesPedagogically(slides: SlideItem[]): SlideItem[] {
  if (slides.length <= 1) return slides;

  const capa = slides.find((s) => s.layout === "capa") ?? slides[0];
  const fechamento =
    slides.find((s) => s.layout === "fechamento" && s !== capa) ??
    slides[slides.length - 1];

  const middle = slides.filter((s) => s !== capa && s !== fechamento);

  middle.sort((a, b) => {
    const stepA = a.sequenceStep ?? 0;
    const stepB = b.sequenceStep ?? 0;
    if (stepA && stepB && stepA !== stepB) return stepA - stepB;
    return 0;
  });

  if (fechamento === capa) {
    return [capa, ...middle];
  }

  return [capa, ...middle, fechamento];
}

export function assignSlideSequenceLabels(slides: SlideItem[]): void {
  let contentIndex = 0;
  const contentTotal = slides.filter(
    (s) => s.layout !== "capa" && s.layout !== "fechamento",
  ).length;

  slides.forEach((slide, index) => {
    const layout =
      slide.layout ??
      (index === 0 ? "capa" : index === slides.length - 1 ? "fechamento" : "conteudo");

    slide.layout = layout;

    if (layout === "capa") {
      slide.sequenceStep = 0;
      slide.sequenceLabel = slide.sequenceLabel || "Abertura";
      return;
    }

    if (layout === "fechamento") {
      slide.sequenceStep = contentTotal + 1;
      slide.sequenceLabel = slide.sequenceLabel || "Síntese e fechamento";
      return;
    }

    contentIndex += 1;
    if (!slide.sequenceStep) slide.sequenceStep = contentIndex;
    if (!slide.sequenceLabel) {
      slide.sequenceLabel = `Etapa ${contentIndex}`;
    }
  });
}
