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

function limitText(value: string, max = 180): string {
  const clean = normalizeText(value);
  if (clean.length <= max) return clean;
  const slice = clean.slice(0, max);
  const lastSpace = slice.lastIndexOf(" ");
  return `${(lastSpace > 80 ? slice.slice(0, lastSpace) : slice).trim()}...`;
}

function uniqueBullets(values: string[], max = 5): string[] {
  const seen = new Set<string>();
  const bullets: string[] = [];

  for (const value of values) {
    const clean = limitText(value, 170);
    const key = clean
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");

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
    const label = cells[0].toLowerCase();
    const value = cells.slice(1).join(" ").replace(/[_/]{3,}/g, "").trim();
    if (!value || value === "-") continue;
    if (/componente|disciplina|ano|serie|s[ée]rie|etapa/i.test(label)) {
      parts.push(value);
    }
  }

  return uniqueBullets(parts, 3).join(" - ");
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
    .filter((text) => !/^notas do professor/i.test(text));
  const tableRows = collectTableBullets(section);

  return uniqueBullets([...tableRows, ...listItems, ...paragraphs], 5);
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
      sections.push({ title: limitText(title, 90), bullets });
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

    const cleanBullets = uniqueBullets(bullets, 5);
    if (title && cleanBullets.length) {
      sections.push({ title: limitText(title, 90), bullets: cleanBullets });
    }
  }

  return sections;
}

function findSection(
  sections: LessonSection[],
  pattern: RegExp,
): LessonSection | undefined {
  return sections.find((section) => pattern.test(section.title));
}

function fallbackBullets(document: Document, max = 5): string[] {
  const candidates = Array.from(document.querySelectorAll("p,li,td"))
    .map(elementText)
    .filter((text) => text.length > 20);

  return uniqueBullets(candidates, max);
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
}): SlideItem {
  return {
    title: input.title,
    bullets: uniqueBullets(input.bullets, 5),
    layout: input.layout ?? "conteudo",
    subtitle: input.subtitle,
    speakerNotes: input.speakerNotes ?? "",
    sequenceStep: input.sequenceStep,
    sequenceLabel: input.sequenceLabel,
    callout: input.callout,
  };
}

function sectionBulletsOrFallback(
  section: LessonSection | undefined,
  fallback: string[],
): string[] {
  return section?.bullets?.length ? section.bullets : fallback;
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
  const subtitle = collectMeta(document) || "Roteiro pronto para conduzir em sala";
  const sections = collectSections(document);
  const fallback = fallbackBullets(document, 6);

  const objective = findSection(sections, /objetiv|expectativa|aprendiz/i);
  const opening = findSection(sections, /abertura|inicio|in[ií]cio|sondagem|context/i);
  const development = findSection(
    sections,
    /desenvolv|metodolog|conte[uú]do|explica|procedimento/i,
  );
  const practice = findSection(
    sections,
    /atividade|pr[aá]tica|exerc[ií]cio|grupo|produ[cç][aã]o/i,
  );
  const schedule = findSection(sections, /cronograma|roteiro|etapa|tempo/i);
  const assessment = findSection(
    sections,
    /avalia|evid[eê]ncia|crit[eé]rio|fechamento|s[ií]ntese/i,
  );

  const slides: SlideItem[] = [
    makeSlide({
      title,
      subtitle,
      layout: "capa",
      bullets: [],
      sequenceStep: 0,
      sequenceLabel: "Abertura",
      speakerNotes:
        "Receba a turma, apresente o tema e explicite o objetivo da aula em linguagem simples.",
    }),
    makeSlide({
      title: "Objetivo da aula",
      bullets: sectionBulletsOrFallback(objective, fallback.slice(0, 4)),
      sequenceStep: 1,
      sequenceLabel: "Objetivo",
      speakerNotes:
        "Leia os objetivos com a turma e conecte a meta da aula ao que sera produzido ou observado.",
    }),
    makeSlide({
      title: "Abertura e contexto",
      bullets: sectionBulletsOrFallback(opening, fallback.slice(0, 4)),
      sequenceStep: 2,
      sequenceLabel: "Abertura",
      speakerNotes:
        "Use este momento para ativar conhecimentos previos e aproximar o conteudo da realidade dos alunos.",
    }),
    makeSlide({
      title: "Desenvolvimento",
      bullets: sectionBulletsOrFallback(development, fallback.slice(1, 6)),
      sequenceStep: 3,
      sequenceLabel: "Desenvolvimento",
      speakerNotes:
        "Conduza a explicacao em blocos curtos, verificando compreensao antes de passar para a pratica.",
    }),
    makeSlide({
      title: "Pratica orientada",
      bullets: sectionBulletsOrFallback(practice ?? schedule, fallback.slice(2, 7)),
      sequenceStep: 4,
      sequenceLabel: "Pratica",
      speakerNotes:
        "Organize a turma, acompanhe as duvidas e registre evidencias enquanto os alunos trabalham.",
    }),
    makeSlide({
      title: "Checagem rapida",
      bullets: [
        "Uma pergunta para verificar se a turma compreendeu a ideia central.",
        "Uma resposta curta para identificar duvidas antes do fechamento.",
        "Uma retomada oral com exemplos dos alunos.",
      ],
      layout: "destaque",
      sequenceStep: 5,
      sequenceLabel: "Checagem",
      callout: {
        title: "Pergunta de sala",
        text: "O que voce consegue explicar agora que ainda nao estava claro no inicio?",
      },
      speakerNotes:
        "Colete respostas rapidas e retome apenas o ponto que a turma demonstrar maior dificuldade.",
    }),
    makeSlide({
      title: "Avaliacao e fechamento",
      bullets: sectionBulletsOrFallback(assessment, fallback.slice(-4)),
      layout: "fechamento",
      sequenceStep: 6,
      sequenceLabel: "Fechamento",
      speakerNotes:
        "Feche com sintese, evidencias observaveis e encaminhamento objetivo para a proxima aula.",
    }),
  ];

  return slides.filter((slide, index) => index === 0 || slide.bullets.length > 0);
}
