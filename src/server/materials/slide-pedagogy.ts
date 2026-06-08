import type { MaterialEngineResponse } from "./material-engine-types";

type SlideItem = NonNullable<MaterialEngineResponse["slides"]>[number];

const ANSWER_BULLET_PATTERN = /^quest[aã]o\s*\d+\s*:/i;
const ANSWER_LEAK_PATTERN =
  /(?:^|\s)(?:gabarito|resposta\s*(?:correta|esperada)?)\s*:/i;

function looksLikeAnswerLine(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  return ANSWER_BULLET_PATTERN.test(trimmed) || ANSWER_LEAK_PATTERN.test(trimmed);
}

function stripAnswerLines(slide: SlideItem): void {
  slide.bullets = (slide.bullets ?? []).filter((line) => !looksLikeAnswerLine(line));
  if (slide.callout?.text && looksLikeAnswerLine(slide.callout.text)) {
    slide.callout = undefined;
  }
}

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

/** Move gabarito para o último slide e remove respostas espalhadas. */
export function consolidateSlideGabarito(
  slides: SlideItem[],
  options: {
    incluirGabarito: boolean;
    exam?: MaterialEngineResponse["exam"];
    answerKey?: string[];
  },
): void {
  if (!slides.length) return;

  for (let index = 0; index < slides.length - 1; index += 1) {
    stripAnswerLines(slides[index]);
  }

  if (!options.incluirGabarito) {
    stripAnswerLines(slides[slides.length - 1]);
    return;
  }

  const answerLines: string[] = [];
  const seen = new Set<string>();

  for (const question of options.exam?.questions ?? []) {
    const answer = question.answer?.trim();
    if (!answer) continue;
    const line = `Questão ${question.number}: ${answer}`;
    if (!seen.has(line)) {
      seen.add(line);
      answerLines.push(line);
    }
  }

  for (const entry of options.answerKey ?? []) {
    const line = entry.trim();
    if (!line || seen.has(line)) continue;
    seen.add(line);
    answerLines.push(line);
  }

  if (!answerLines.length) return;

  const last = slides[slides.length - 1];
  stripAnswerLines(last);

  const preserved = (last.bullets ?? []).filter((line) => line.trim());
  const hasGabaritoTitle = /gabarito/i.test(last.title);

  last.layout = "fechamento";
  last.title = hasGabaritoTitle ? last.title : "Gabarito";
  last.sequenceLabel = "Gabarito";
  last.bullets = [...preserved, ...answerLines];
}
