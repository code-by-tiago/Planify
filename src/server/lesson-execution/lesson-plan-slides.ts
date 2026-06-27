import { parseHTML } from "linkedom";
import type { MaterialEngineResponse } from "@/server/materials/material-engine-types";

type SlideItem = NonNullable<MaterialEngineResponse["slides"]>[number];

type LessonSection = {
  title: string;
  bullets: string[];
};

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .replace(/^[\-:;,.]+|[\-:;,.]+$/g, "")
    .trim();
}

function searchText(value: unknown): string {
  return normalizeText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function limitText(value: string, max = 118): string {
  const clean = normalizeText(value);
  if (clean.length <= max) return clean;
  const slice = clean.slice(0, max);
  const lastSpace = slice.lastIndexOf(" ");
  return `${(lastSpace > 70 ? slice.slice(0, lastSpace) : slice).trim()}...`;
}

function polishBullet(value: string): string {
  const clean = normalizeText(value)
    .replace(/[_/]{3,}/g, "")
    .replace(/\s*[-–—]\s*/g, " - ");

  const [label, ...rest] = clean.split(" - ");
  const body = rest.join(" - ").trim();

  if (body && label.length <= 32 && /tempo|etapa|acao|atividade|recurso|avaliacao|objetivo|metodo/i.test(label)) {
    return `${label}: ${body}`;
  }

  return clean;
}

function uniqueBullets(values: string[], max = 3): string[] {
  const seen = new Set<string>();
  const bullets: string[] = [];

  for (const value of values) {
    const clean = limitText(polishBullet(value), 116);
    const key = searchText(clean);

    if (!clean || clean.length < 8 || seen.has(key)) continue;
    seen.add(key);
    bullets.push(clean);
    if (bullets.length >= max) break;
  }

  return bullets;
}

function elementText(element: Element | null | undefined): string {
  return normalizeText(element?.textContent || "");
}

function collectMeta(document: Document): string {
  const rows = Array.from(document.querySelectorAll(".planify-doc-meta tr"));
  const parts: string[] = [];

  for (const row of rows) {
    const cells = Array.from(row.querySelectorAll("th,td")).map(elementText);
    if (cells.length < 2) continue;
    const label = searchText(cells[0]);
    const value = cells.slice(1).join(" ").replace(/[_/]{3,}/g, "").trim();
    if (!value || value === "-") continue;
    if (/componente|disciplina|ano|serie|etapa|turma/.test(label)) {
      parts.push(value);
    }
  }

  return uniqueBullets(parts, 3).join(" | ");
}

function collectTableBullets(section: Element): string[] {
  const rows = Array.from(section.querySelectorAll("tbody tr"));
  const bullets: string[] = [];

  for (const row of rows) {
    const cells = Array.from(row.querySelectorAll("th,td"))
      .map(elementText)
      .filter(Boolean);
    if (cells.length >= 2) {
      bullets.push(cells.join(" - "));
    }
  }

  return bullets;
}

function collectSectionBullets(section: Element): string[] {
  const listItems = Array.from(section.querySelectorAll("li")).map(elementText);
  const paragraphs = Array.from(section.querySelectorAll("p"))
    .map(elementText)
    .filter((text) => !/^notas do professor/i.test(searchText(text)));
  const tableRows = collectTableBullets(section);

  return uniqueBullets([...tableRows, ...listItems, ...paragraphs], 3);
}

function collectSections(document: Document): LessonSection[] {
  const sectionElements = Array.from(
    document.querySelectorAll(".planify-doc-body section, article section, section"),
  );

  const sections: LessonSection[] = [];

  for (const section of sectionElements) {
    const title =
      elementText(section.querySelector("h2")) ||
      elementText(section.querySelector("h3")) ||
      elementText(section.querySelector("h1"));
    const bullets = collectSectionBullets(section);

    if (title && bullets.length) {
      sections.push({ title: limitText(title, 78), bullets });
    }
  }

  if (sections.length) return sections;

  const headings = Array.from(document.querySelectorAll("h2,h3"));
  for (const heading of headings) {
    const title = elementText(heading);
    const bullets: string[] = [];
    let cursor = heading.nextElementSibling;

    while (cursor && !/^H[23]$/i.test(cursor.tagName)) {
      if (/^(P|LI|TD)$/i.test(cursor.tagName)) bullets.push(elementText(cursor));
      bullets.push(...Array.from(cursor.querySelectorAll("li,p")).map(elementText));
      cursor = cursor.nextElementSibling;
    }

    const cleanBullets = uniqueBullets(bullets, 3);
    if (title && cleanBullets.length) {
      sections.push({ title: limitText(title, 78), bullets: cleanBullets });
    }
  }

  return sections;
}

function findSection(
  sections: LessonSection[],
  pattern: RegExp,
): LessonSection | undefined {
  return sections.find((section) => pattern.test(searchText(section.title)));
}

function fallbackBullets(document: Document, max = 4): string[] {
  const candidates = Array.from(document.querySelectorAll("p,li,td"))
    .map(elementText)
    .filter((text) => text.length > 20);

  return uniqueBullets(candidates, max);
}

function sectionBulletsOrFallback(
  section: LessonSection | undefined,
  fallback: string[],
  defaults: string[],
): string[] {
  if (section?.bullets?.length) return section.bullets;
  if (fallback.length) return uniqueBullets(fallback, 3);
  return defaults;
}

function makeSlide(input: {
  title: string;
  bullets: string[];
  layout?: SlideItem["layout"];
  subtitle?: string;
  speakerNotes?: string;
  sequenceStep: number;
  sequenceLabel: string;
  callout?: SlideItem["callout"];
  accentColor?: SlideItem["accentColor"];
  iconHint?: string;
}): SlideItem {
  return {
    title: input.title,
    bullets: uniqueBullets(input.bullets, input.layout === "fechamento" ? 4 : 3),
    layout: input.layout ?? "conteudo",
    subtitle: input.subtitle,
    speakerNotes: input.speakerNotes ?? "",
    sequenceStep: input.sequenceStep,
    sequenceLabel: input.sequenceLabel,
    callout: input.callout,
    accentColor: input.accentColor,
    iconHint: input.iconHint,
  };
}

export function buildLessonPlanSlidesFromHtml(input: {
  title: string;
  html: string;
}): SlideItem[] {
  const { document } = parseHTML(String(input.html || ""));
  const title =
    elementText(document.querySelector(".planify-doc-title")) ||
    elementText(document.querySelector("h1")) ||
    normalizeText(input.title) ||
    "Plano de aula";
  const subtitle = collectMeta(document) || "Roteiro premium para conduzir em sala";
  const sections = collectSections(document);
  const fallback = fallbackBullets(document, 6);

  const objective = findSection(sections, /objetiv|expectativa|aprendiz|habilidade/);
  const opening = findSection(sections, /abertura|inicio|sondagem|context|problematiz/);
  const development = findSection(
    sections,
    /desenvolv|metodolog|conteudo|explica|procedimento|conceito/,
  );
  const practice = findSection(
    sections,
    /atividade|pratica|exercicio|grupo|producao|aplicacao/,
  );
  const schedule = findSection(sections, /cronograma|roteiro|etapa|tempo/);
  const assessment = findSection(
    sections,
    /avalia|evidencia|criterio|fechamento|sintese|retomada/,
  );

  const objectiveBullets = sectionBulletsOrFallback(objective, fallback.slice(0, 3), [
    "Apresente a meta da aula em linguagem simples.",
    "Mostre o que a turma deve conseguir explicar, resolver ou produzir.",
    "Conecte o objetivo a uma evidencia observavel.",
  ]);
  const openingBullets = sectionBulletsOrFallback(opening, fallback.slice(0, 3), [
    "Recupere conhecimentos previos com uma pergunta curta.",
    "Use um exemplo proximo da realidade da turma.",
    "Nomeie o desafio que sera investigado na aula.",
  ]);
  const developmentBullets = sectionBulletsOrFallback(development, fallback.slice(1, 4), [
    "Explique a ideia central em blocos curtos.",
    "Modele um exemplo antes de pedir autonomia.",
    "Cheque compreensao antes de avancar.",
  ]);
  const practiceBullets = sectionBulletsOrFallback(
    practice ?? schedule,
    fallback.slice(2, 5),
    [
      "Organize a turma para aplicar o conceito.",
      "Circule pela sala para observar estrategias e duvidas.",
      "Registre evidencias para orientar a devolutiva.",
    ],
  );
  const assessmentBullets = sectionBulletsOrFallback(assessment, fallback.slice(-3), [
    "Retome a ideia central com a turma.",
    "Colete uma resposta curta como evidencia de aprendizagem.",
    "Indique o proximo passo ou tarefa de continuidade.",
  ]);

  const slides: SlideItem[] = [
    makeSlide({
      title,
      subtitle,
      layout: "capa",
      bullets: [],
      sequenceStep: 0,
      sequenceLabel: "Abertura",
      speakerNotes:
        "Receba a turma, apresente o tema e explicite o resultado esperado da aula em uma frase.",
    }),
    makeSlide({
      title: "Mapa da aula",
      subtitle: "Um roteiro enxuto para conduzir sem improviso",
      layout: "destaque",
      bullets: [
        "Conectar o tema ao repertorio da turma.",
        "Construir a ideia central com exemplo guiado.",
        "Aplicar, checar e registrar evidencias.",
      ],
      sequenceStep: 1,
      sequenceLabel: "Roteiro",
      callout: {
        title: "Ritmo sugerido",
        text: "Trabalhe em ciclos curtos: explicar, praticar, checar e ajustar.",
      },
      speakerNotes:
        "Mostre para a turma como a aula vai acontecer. Isso reduz ansiedade e melhora engajamento.",
    }),
    makeSlide({
      title: "Objetivo essencial",
      subtitle: "O que a turma precisa conseguir fazer ao final",
      layout: "destaque",
      bullets: objectiveBullets,
      sequenceStep: 2,
      sequenceLabel: "Objetivo",
      callout: {
        title: "Foco do professor",
        text: "Transforme o objetivo em uma evidencia concreta: fala, registro, resolucao ou produto.",
      },
      speakerNotes:
        "Leia o objetivo e traduza para uma acao observavel. Evite termos abstratos sem exemplo.",
    }),
    makeSlide({
      title: "Pergunta de abertura",
      subtitle: "Ative repertorio antes da explicacao",
      bullets: openingBullets,
      sequenceStep: 3,
      sequenceLabel: "Aquecimento",
      callout: {
        title: "Pergunta-chave",
        text: "Que exemplo da vida real ajuda a turma a entrar neste tema agora?",
      },
      speakerNotes:
        "Use a pergunta para diagnosticar o ponto de partida. Nao corrija tudo ainda; colete pistas.",
    }),
    makeSlide({
      title: "Ideia central",
      subtitle: "Explique em camadas curtas e verificaveis",
      bullets: developmentBullets,
      sequenceStep: 4,
      sequenceLabel: "Desenvolvimento",
      speakerNotes:
        "Conduza a explicacao em blocos de 8 a 12 minutos e pare para uma checagem simples.",
    }),
    makeSlide({
      title: "Atividade guiada",
      subtitle: "Transforme explicacao em acao",
      bullets: practiceBullets,
      sequenceStep: 5,
      sequenceLabel: "Pratica",
      callout: {
        title: "Mediação",
        text: "Circule, observe estrategias e intervenha com perguntas antes de entregar a resposta.",
      },
      speakerNotes:
        "Defina tempo, agrupamento e criterio de sucesso. Registre evidencias enquanto os alunos trabalham.",
    }),
    makeSlide({
      title: "Checagem interativa",
      subtitle: "Abra esta pergunta na sala ao vivo IAPlanify",
      layout: "destaque",
      bullets: ["Entendi bem", "Preciso de mais um exemplo", "Ainda tenho duvida"],
      sequenceStep: 6,
      sequenceLabel: "Interacao",
      callout: {
        title: "Pergunta para a turma",
        text: "O que voce consegue explicar agora que ainda nao estava claro no inicio?",
      },
      speakerNotes:
        "Abra a pergunta na sala ao vivo. Use o resultado para decidir se fecha, retoma ou exemplifica.",
    }),
    makeSlide({
      title: "Fechamento com evidencias",
      subtitle: "Sintese, registro e proximo passo",
      bullets: assessmentBullets,
      layout: "fechamento",
      sequenceStep: 7,
      sequenceLabel: "Fechamento",
      callout: {
        title: "Evidencia final",
        text: "Peca uma resposta curta: o que aprendi, onde apliquei e qual duvida permanece?",
      },
      speakerNotes:
        "Feche com sintese objetiva, evidencias observaveis e encaminhamento para continuidade.",
    }),
  ];

  return slides.filter((slide, index) => index === 0 || slide.bullets.length > 0);
}
