import { buildVisualGameMaterial } from "@/lib/materiais/game-builder";
import { generateGeminiJSON } from "../ai/gemini-client";
import { getMaterialEngineSchema } from "./material-engine-schemas";
import {
  buildMaterialEnginePrompt,
  buildMaterialEngineSystemInstruction,
} from "./material-engine-prompts";
import {
  buildQualityRetryPrompt,
  getEngineOutputIssues,
} from "./material-engine-quality";
import {
  normalizeMaterialEngineRequest,
  validateMaterialEngineRequest,
} from "./material-engine-validation";
import {
  SLIDE_ACCENTS,
  SLIDE_LAYOUTS,
  type MaterialEngineInput,
  type MaterialEngineRequest,
  type MaterialEngineResponse,
  type MaterialEngineType,
  type SlideAccent,
  type SlideLayout,
} from "./material-engine-types";
import { enrichSlidesWithImages } from "./slide-image-resolver";
import {
  assignSlideSequenceLabels,
  orderSlidesPedagogically,
} from "./slide-pedagogy";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function asList(items: string[], ordered = false) {
  const clean = items.filter((item) => item.trim());
  if (!clean.length) return "";
  const tag = ordered ? "ol" : "ul";
  return `<${tag}>${clean.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</${tag}>`;
}

function renderSections(response: MaterialEngineResponse): string {
  return response.sections
    .map(
      (section) => `
        <section>
          <h2>${escapeHtml(section.title)}</h2>
          ${section.content ? `<p>${escapeHtml(section.content)}</p>` : ""}
          ${asList(section.bullets || [])}
        </section>
      `,
    )
    .join("");
}

function renderActivities(response: MaterialEngineResponse): string {
  if (!response.activities.length) return "";
  return `
    <section>
      <h2>Atividades</h2>
      ${response.activities
        .map(
          (activity) => `
            <article>
              <h3>${escapeHtml(activity.title)}</h3>
              ${activity.instructions ? `<p>${escapeHtml(activity.instructions)}</p>` : ""}
              ${asList(activity.items || [])}
            </article>
          `,
        )
        .join("")}
    </section>
  `;
}

type RenderContext = {
  tipo: MaterialEngineType;
  incluirGabarito: boolean;
};

function mapGameFormato(formato: string | null): string {
  const raw = (formato || "caca-palavras").toLowerCase();
  if (raw === "caca-palavras") return "caca_palavras";
  if (raw === "trilha") return "trilha";
  return raw.replace(/-/g, "_");
}

function renderExam(response: MaterialEngineResponse, ctx?: RenderContext): string {
  const questions = response.exam?.questions ?? [];
  if (!questions.length) return "";

  const tipo = ctx?.tipo ?? "prova";
  const heading = tipo === "lista" ? "Exercícios" : "Questões";

  const body = questions
    .map((question) => {
      const options =
        question.options && question.options.length
          ? `<ol type="a">${question.options
              .map((option) => `<li>${escapeHtml(option)}</li>`)
              .join("")}</ol>`
          : "";

      return `
        <article class="planify-questao">
          <p><strong>${question.number}.</strong> ${escapeHtml(question.statement)}</p>
          ${options}
        </article>
      `;
    })
    .join("");

  return `<section><h2>${heading}</h2>${body}</section>`;
}

function renderGame(response: MaterialEngineResponse): string {
  const game = response.game;
  if (!game) return "";

  return `
    <section>
      <h2>Jogo: ${escapeHtml(game.format)}</h2>
      ${game.rules.length ? `<h3>Regras</h3>${asList(game.rules, true)}` : ""}
      ${game.components.length ? `<h3>Componentes</h3>${asList(game.components)}` : ""}
    </section>
  `;
}

type SlideAccentTheme = {
  base: string;
  strong: string;
  soft: string;
  ink: string;
};

const SLIDE_ACCENT_THEMES: Record<string, SlideAccentTheme> = {
  indigo: { base: "#6366f1", strong: "#4f46e5", soft: "#eef2ff", ink: "#3730a3" },
  violet: { base: "#8b5cf6", strong: "#7c3aed", soft: "#f5f3ff", ink: "#5b21b6" },
  coral: { base: "#fb7185", strong: "#f43f5e", soft: "#fff1f2", ink: "#9f1239" },
  amber: { base: "#f59e0b", strong: "#d97706", soft: "#fffbeb", ink: "#92400e" },
  emerald: { base: "#10b981", strong: "#059669", soft: "#ecfdf5", ink: "#065f46" },
  sky: { base: "#0ea5e9", strong: "#0284c7", soft: "#f0f9ff", ink: "#075985" },
  rose: { base: "#f43f5e", strong: "#e11d48", soft: "#fff1f2", ink: "#9f1239" },
};

const SLIDE_ACCENT_ROTATION = ["indigo", "violet", "sky", "emerald", "amber", "coral"];

const SLIDE_PICTURE_SVG =
  '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="m21 16-5-5L5 20"/></svg>';

function slideBulletsHtml(bullets: string[], color: string): string {
  const clean = bullets.filter((item) => item.trim());
  if (!clean.length) return "";
  return `<ul style="margin:0;padding-left:20px;list-style:disc;">${clean
    .map(
      (item) =>
        `<li style="margin:7px 0;font-size:15px;line-height:1.55;color:#334155;"><span style="color:${color};">●</span>&nbsp;<span style="color:#1e293b;">${escapeHtml(item)}</span></li>`,
    )
    .join("")}</ul>`;
}

function slideFigureHtml(
  slide: {
    imageUrl?: string;
    imageAlt?: string;
    imagePrompt?: string;
  },
  theme: SlideAccentTheme,
): string {
  if (slide.imageUrl?.trim()) {
    const alt = escapeHtml(slide.imageAlt || slide.imagePrompt || "Ilustração do slide");
    return `<figure class="planify-slide-figure" data-planify-slide-image="true" style="margin:0;border-radius:14px;overflow:hidden;border:1px solid ${theme.base}33;background:${theme.soft};">
      <img src="${escapeHtml(slide.imageUrl)}" alt="${alt}" class="planify-slide-image" data-planify-image="true" style="display:block;width:100%;max-height:280px;object-fit:cover;cursor:pointer;" />
    </figure>`;
  }

  if (!slide.imagePrompt?.trim()) return "";

  return `<figure class="planify-slide-figure planify-slide-figure--pending" data-planify-slide-image="true" style="margin:0;border-radius:14px;overflow:hidden;border:1px dashed ${theme.base};background:${theme.soft};padding:14px;text-align:center;">
      <span style="display:inline-flex;align-items:center;justify-content:center;width:42px;height:42px;border-radius:10px;background:#ffffff;color:${theme.strong};">${SLIDE_PICTURE_SVG}</span>
      <p style="margin:8px 0 0;font-size:11px;font-weight:700;color:${theme.ink};">Imagem não encontrada — clique em Imagem no editor para substituir</p>
    </figure>`;
}

function slideCalloutHtml(
  callout: { title?: string; text?: string } | undefined,
  theme: SlideAccentTheme,
): string {
  if (!callout || !callout.text) return "";
  return `<div style="margin-top:14px;border-left:4px solid ${theme.base};background:${theme.soft};border-radius:0 12px 12px 0;padding:12px 16px;">
      ${callout.title ? `<p style="margin:0 0 4px;font-size:13px;font-weight:800;color:${theme.ink};">★ ${escapeHtml(callout.title)}</p>` : ""}
      <p style="margin:0;font-size:14px;line-height:1.55;color:#334155;">${escapeHtml(callout.text)}</p>
    </div>`;
}

function slideNotesHtml(notes: string, theme: SlideAccentTheme): string {
  if (!notes) return "";
  return `<div style="margin-top:14px;padding:11px 14px;background:#f8fafc;border-left:3px solid ${theme.base};border-radius:8px;">
      <span style="display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${theme.ink};margin-bottom:4px;">Notas do professor</span>
      <span style="font-size:13px;line-height:1.55;color:#475569;">${escapeHtml(notes)}</span>
    </div>`;
}

function renderSlides(response: MaterialEngineResponse): string {
  const rawSlides = response.slides ?? [];
  if (!rawSlides.length) return "";

  const slides = orderSlidesPedagogically([...rawSlides]);
  assignSlideSequenceLabels(slides);

  const total = slides.length;
  const contentTotal = slides.filter(
    (s) => s.layout !== "capa" && s.layout !== "fechamento",
  ).length;
  let contentCounter = 0;

  const body = slides
    .map((slide, index) => {
      const isFirst = index === 0;
      const isLast = index === total - 1;

      const layout =
        slide.layout ?? (isFirst ? "capa" : isLast ? "fechamento" : "conteudo");
      const accentName =
        slide.accentColor ?? SLIDE_ACCENT_ROTATION[index % SLIDE_ACCENT_ROTATION.length];
      const theme = SLIDE_ACCENT_THEMES[accentName] ?? SLIDE_ACCENT_THEMES.indigo;

      const bullets = (slide.bullets || []).filter((item) => item.trim());

      let tag = "CONTEÚDO";
      let positionLabel = "";

      if (layout === "capa") {
        tag = "CAPA";
      } else if (layout === "fechamento") {
        tag = "FECHAMENTO";
        positionLabel = "Síntese";
      } else {
        contentCounter += 1;
        const step = slide.sequenceStep ?? contentCounter;
        const label = slide.sequenceLabel || `Etapa ${contentCounter}`;
        tag = `${label.toUpperCase()}`;
        positionLabel = `${contentCounter} / ${contentTotal}`;
      }

      // Capa: bloco com gradiente da cor de destaque.
      if (layout === "capa") {
        return `
          <div class="planify-slide" style="margin:0 0 22px;border-radius:18px;overflow:hidden;background:linear-gradient(135deg,${theme.strong},${theme.base});color:#ffffff;box-shadow:0 18px 40px -22px ${theme.base};">
            <div style="padding:34px 30px;">
              <span style="display:inline-block;font-size:11px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;background:rgba(255,255,255,0.2);padding:5px 12px;border-radius:999px;">Planify · Apresentação</span>
              <h3 style="margin:16px 0 0;font-size:30px;font-weight:900;line-height:1.18;">${escapeHtml(slide.title)}</h3>
              ${slide.subtitle ? `<p style="margin:12px 0 0;font-size:17px;font-weight:500;line-height:1.5;color:rgba(255,255,255,0.92);">${escapeHtml(slide.subtitle)}</p>` : ""}
              <p style="margin:20px 0 0;font-size:12px;font-weight:700;color:rgba(255,255,255,0.85);">${total} slides</p>
            </div>
          </div>
        `;
      }

      const header = `<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 20px;background:${theme.soft};color:${theme.ink};border-bottom:1px solid ${theme.base}33;">
          <span style="font-size:12px;font-weight:800;letter-spacing:0.06em;">${tag}</span>
          <span style="font-size:12px;font-weight:700;opacity:0.8;">${positionLabel || `${index + 1} / ${total}`}</span>
        </div>`;

      const titleHtml = `<h3 style="margin:0 0 14px;font-size:21px;font-weight:800;color:#0f172a;line-height:1.25;border-left:5px solid ${theme.base};padding-left:12px;">${escapeHtml(slide.title)}</h3>`;

      const bulletsHtml = slideBulletsHtml(bullets, theme.base);
      const figureHtml = slideFigureHtml(slide, theme);
      const calloutHtml = slideCalloutHtml(slide.callout, theme);
      const notesHtml = slideNotesHtml(slide.speakerNotes, theme);

      let inner = "";

      if (layout === "duasColunas") {
        const right = [figureHtml, calloutHtml].filter(Boolean).join("");
        inner = `${titleHtml}
          <div style="display:flex;flex-wrap:wrap;gap:18px;align-items:flex-start;">
            <div style="flex:1 1 280px;min-width:240px;">${bulletsHtml}</div>
            <div style="flex:1 1 220px;min-width:200px;">${right || figureHtml}</div>
          </div>
          ${notesHtml}`;
      } else if (layout === "destaque") {
        const bigCallout = slide.callout?.text
          ? `<div style="margin:0 0 14px;text-align:center;background:${theme.soft};border:1px solid ${theme.base}33;border-radius:14px;padding:22px;">
               ${slide.callout.title ? `<p style="margin:0 0 8px;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:${theme.ink};">${escapeHtml(slide.callout.title)}</p>` : ""}
               <p style="margin:0;font-size:20px;font-weight:700;line-height:1.4;color:#0f172a;">${escapeHtml(slide.callout.text)}</p>
             </div>`
          : "";
        inner = `${titleHtml}${bigCallout}${bulletsHtml}${figureHtml ? `<div style="margin-top:14px;">${figureHtml}</div>` : ""}${notesHtml}`;
      } else if (layout === "fechamento") {
        inner = `${titleHtml}
          ${slide.subtitle ? `<p style="margin:0 0 12px;font-size:15px;font-weight:600;color:${theme.ink};">${escapeHtml(slide.subtitle)}</p>` : ""}
          ${bulletsHtml}${calloutHtml}${notesHtml}`;
      } else {
        inner = `${titleHtml}${bulletsHtml}${figureHtml ? `<div style="margin-top:14px;">${figureHtml}</div>` : ""}${calloutHtml}${notesHtml}`;
      }

      return `
        <div class="planify-slide" style="margin:0 0 22px;border:1px solid #e8e6f5;border-radius:18px;overflow:hidden;background:#ffffff;box-shadow:0 10px 30px -20px rgba(79,70,229,0.45);">
          ${header}
          <div style="padding:20px 24px 24px;">${inner}</div>
        </div>
      `;
    })
    .join("");

  return `<section><h2>Apresentação · ${total} slides</h2>${body}</section>`;
}

function renderFlashcards(response: MaterialEngineResponse): string {
  const flashcards = response.flashcards ?? [];
  if (!flashcards.length) return "";

  const body = flashcards
    .map(
      (card, index) => `
        <article class="planify-flashcard">
          <p><strong>Card ${index + 1}</strong></p>
          <p><strong>Frente:</strong> ${escapeHtml(card.front)}</p>
          <p><strong>Verso:</strong> ${escapeHtml(card.back)}</p>
        </article>
      `,
    )
    .join("");

  return `<section><h2>Flashcards</h2>${body}</section>`;
}

function renderMindMap(response: MaterialEngineResponse): string {
  const mindMap = response.mindMap;
  if (!mindMap || !mindMap.branches.length) return "";

  const branchCards = mindMap.branches
    .map(
      (branch, index) => `
        <div class="planify-mindmap-branch" style="flex:1 1 220px;min-width:200px;border:2px solid #6366f1;border-radius:14px;padding:14px;background:#f8fafc;">
          <p style="margin:0 0 8px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:#4f46e5;">Ramo ${index + 1}</p>
          <h3 style="margin:0 0 10px;font-size:16px;color:#0f172a;">${escapeHtml(branch.title)}</h3>
          ${asList(branch.items || [])}
        </div>
      `,
    )
    .join("");

  return `
    <section class="planify-mindmap">
      <h2>Mapa mental</h2>
      <div style="display:flex;flex-wrap:wrap;gap:16px;align-items:stretch;margin:16px 0;">
        <div style="flex:1 1 100%;text-align:center;padding:20px;border-radius:16px;background:linear-gradient(135deg,#4f46e5,#6366f1);color:#fff;box-shadow:0 12px 28px -16px #4f46e5;">
          <p style="margin:0;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;opacity:0.9;">Conceito central</p>
          <p style="margin:8px 0 0;font-size:22px;font-weight:900;">${escapeHtml(mindMap.central)}</p>
        </div>
        ${branchCards}
      </div>
      <p style="margin:12px 0 0;font-size:13px;color:#64748b;">Conexões: cada ramo articula subtópicos ao conceito central — use as setas implícitas na discussão em sala.</p>
    </section>
  `;
}

function renderLessonPlan(response: MaterialEngineResponse): string {
  const steps = response.lessonPlan?.steps ?? [];
  if (!steps.length) return "";

  const body = steps
    .map(
      (step) => `
        <article class="planify-etapa">
          <h3>${escapeHtml(step.stage)}${step.duration ? ` (${escapeHtml(step.duration)})` : ""}</h3>
          ${step.description ? `<p>${escapeHtml(step.description)}</p>` : ""}
          ${step.resources.length ? `<p><em>Recursos:</em></p>${asList(step.resources)}` : ""}
        </article>
      `,
    )
    .join("");

  return `<section><h2>Etapas da aula</h2>${body}</section>`;
}

function renderAnswerKey(response: MaterialEngineResponse, ctx?: RenderContext): string {
  if (!ctx?.incluirGabarito) return "";

  const merged = [...response.answerKey];
  const label = ctx.tipo === "lista" ? "Exercício" : "Questão";

  for (const question of response.exam?.questions ?? []) {
    const answer = question.answer?.trim();
    if (!answer) continue;
    const entry = `${label} ${question.number}: ${answer}`;
    const exists = merged.some(
      (line) =>
        line.includes(`${label} ${question.number}:`) ||
        line.includes(`Questão ${question.number}:`) ||
        line.includes(`Exercício ${question.number}:`),
    );
    if (!exists) merged.push(entry);
  }

  if (!merged.length) return "";

  const title =
    ctx.tipo === "prova" || ctx.tipo === "lista"
      ? "Gabarito e critérios de correção"
      : "Gabarito";

  return `<section><h2>${title}</h2>${asList(merged, true)}</section>`;
}

function renderTeacherNotes(response: MaterialEngineResponse): string {
  if (!response.teacherNotes.length) return "";
  return `<section><h2>Notas para o professor</h2>${asList(response.teacherNotes)}</section>`;
}

function renderHtml(response: MaterialEngineResponse, ctx?: RenderContext): string {
  if (response.html && /<[a-z][\s\S]*>/i.test(response.html)) {
    return response.html;
  }

  const blocks = [
    renderSections(response),
    renderLessonPlan(response),
    renderMindMap(response),
    renderSlides(response),
    renderGame(response),
    renderFlashcards(response),
    renderExam(response, ctx),
    renderActivities(response),
    renderAnswerKey(response, ctx),
    renderTeacherNotes(response),
  ]
    .filter(Boolean)
    .join("");

  return `
    <article class="planify-doc">
      <h1>${escapeHtml(response.title)}</h1>
      ${response.subtitle ? `<p class="planify-doc-subtitle">${escapeHtml(response.subtitle)}</p>` : ""}
      ${response.summary ? `<p>${escapeHtml(response.summary)}</p>` : ""}
      ${blocks}
    </article>
  `.trim();
}

function normalizeOutput(
  request: MaterialEngineRequest,
  response: Partial<MaterialEngineResponse>,
): MaterialEngineResponse {
  const normalized: MaterialEngineResponse = {
    title: String(response.title || `${request.tema} — ${request.tipoMaterial}`),
    subtitle: String(
      response.subtitle ||
        `${request.componenteCurricular} • ${request.anoSerie}`,
    ),
    summary: String(
      response.summary ||
        `Material de ${request.tipoMaterial} sobre ${request.tema}.`,
    ),
    sections: Array.isArray(response.sections)
      ? response.sections.map((section) => ({
          title: String(section?.title || "Seção"),
          content: String(section?.content || ""),
          bullets: Array.isArray(section?.bullets)
            ? section.bullets.map((item) => String(item))
            : [],
        }))
      : [],
    activities: Array.isArray(response.activities)
      ? response.activities.map((activity) => ({
          title: String(activity?.title || "Atividade"),
          instructions: String(activity?.instructions || ""),
          items: Array.isArray(activity?.items)
            ? activity.items.map((item) => String(item))
            : [],
        }))
      : [],
    answerKey: Array.isArray(response.answerKey)
      ? response.answerKey.map((item) => String(item))
      : [],
    teacherNotes: Array.isArray(response.teacherNotes)
      ? response.teacherNotes.map((item) => String(item))
      : [],
    game: response.game
      ? {
          format: String(response.game.format || request.formatoJogo || "jogo"),
          rules: Array.isArray(response.game.rules)
            ? response.game.rules.map((item) => String(item))
            : [],
          components: Array.isArray(response.game.components)
            ? response.game.components.map((item) => String(item))
            : [],
        }
      : undefined,
    slides: Array.isArray(response.slides)
      ? response.slides.map((slide) => {
          const layout =
            typeof slide?.layout === "string" &&
            (SLIDE_LAYOUTS as readonly string[]).includes(slide.layout)
              ? (slide.layout as SlideLayout)
              : undefined;
          const accentColor =
            typeof slide?.accentColor === "string" &&
            (SLIDE_ACCENTS as readonly string[]).includes(slide.accentColor)
              ? (slide.accentColor as SlideAccent)
              : undefined;
          const calloutText = slide?.callout?.text
            ? String(slide.callout.text)
            : "";
          const callout = calloutText
            ? {
                title: slide?.callout?.title
                  ? String(slide.callout.title)
                  : undefined,
                text: calloutText,
              }
            : undefined;

          return {
            title: String(slide?.title || "Slide"),
            bullets: Array.isArray(slide?.bullets)
              ? slide.bullets.map((item) => String(item))
              : [],
            speakerNotes: String(slide?.speakerNotes || ""),
            layout,
            subtitle: slide?.subtitle ? String(slide.subtitle) : undefined,
            imagePrompt: slide?.imagePrompt
              ? String(slide.imagePrompt)
              : undefined,
            imageUrl: slide?.imageUrl ? String(slide.imageUrl) : undefined,
            imageAlt: slide?.imageAlt ? String(slide.imageAlt) : undefined,
            sequenceStep:
              typeof slide?.sequenceStep === "number"
                ? slide.sequenceStep
                : undefined,
            sequenceLabel: slide?.sequenceLabel
              ? String(slide.sequenceLabel)
              : undefined,
            accentColor,
            iconHint: slide?.iconHint ? String(slide.iconHint) : undefined,
            callout,
          };
        })
      : undefined,
    flashcards: Array.isArray(response.flashcards)
      ? response.flashcards.map((item) => ({
          front: String(item?.front || ""),
          back: String(item?.back || ""),
        }))
      : undefined,
    exam: response.exam
      ? {
          questions: Array.isArray(response.exam.questions)
            ? response.exam.questions.map((question, index) => ({
                number: Number.isFinite(Number(question?.number))
                  ? Number(question.number)
                  : index + 1,
                type: String(question?.type || "dissertativa"),
                statement: String(question?.statement || ""),
                options: Array.isArray(question?.options)
                  ? question.options.map((item) => String(item))
                  : [],
                answer: String(question?.answer || ""),
              }))
            : [],
        }
      : undefined,
    mindMap: response.mindMap
      ? {
          central: String(response.mindMap.central || request.tema),
          branches: Array.isArray(response.mindMap.branches)
            ? response.mindMap.branches.map((branch) => ({
                title: String(branch?.title || ""),
                items: Array.isArray(branch?.items)
                  ? branch.items.map((item) => String(item))
                  : [],
              }))
            : [],
        }
      : undefined,
    lessonPlan: response.lessonPlan
      ? {
          steps: Array.isArray(response.lessonPlan.steps)
            ? response.lessonPlan.steps.map((step) => ({
                stage: String(step?.stage || "Etapa"),
                duration: String(step?.duration || ""),
                description: String(step?.description || ""),
                resources: Array.isArray(step?.resources)
                  ? step.resources.map((item) => String(item))
                  : [],
              }))
            : [],
        }
      : undefined,
    html: typeof response.html === "string" ? response.html : undefined,
  };

  if (!request.incluirGabarito) {
    normalized.answerKey = [];
    if (normalized.exam) {
      normalized.exam.questions = normalized.exam.questions.map((question) => ({
        ...question,
        answer: "",
      }));
    }
  }

  return normalized;
}

function renderDocumentHtml(
  request: MaterialEngineRequest,
  normalized: MaterialEngineResponse,
): string {
  const ctx: RenderContext = {
    tipo: request.tipoMaterial,
    incluirGabarito: request.incluirGabarito,
  };
  const base = renderHtml(normalized, ctx);

  if (request.tipoMaterial !== "jogo") return base;

  try {
    const visual = buildVisualGameMaterial({
      titulo: normalized.title,
      etapa: request.etapa,
      anoSerie: request.anoSerie,
      componenteCurricular: request.componenteCurricular,
      tipo: "jogo",
      modeloJogo: mapGameFormato(request.formatoJogo),
      tema: request.tema,
      objetivos: request.objetivo,
      conteudos: request.tema,
      orientacoes: request.objetivo || undefined,
    });
    const extra = visual.printHtml || visual.visualHtml || "";
    if (extra) {
      return `${base}<div class="planify-jogo-visual">${extra}</div>`;
    }
  } catch {
    // Mantém entrega textual se o builder visual falhar.
  }

  return base;
}

function maxOutputTokensFor(type: MaterialEngineType): number {
  if (type === "slides") return 12000;
  if (type === "flashcards" || type === "mapa-mental") return 8000;
  if (type === "prova" || type === "lista" || type === "apostila") return 16000;
  return 12000;
}

export async function generateMaterialByEngine(input: MaterialEngineInput) {
  const request = normalizeMaterialEngineRequest(input);
  const errors = validateMaterialEngineRequest(request);

  if (errors.length > 0) {
    return {
      ok: false as const,
      status: 400,
      message: errors[0],
    };
  }

  const schema = getMaterialEngineSchema(request.tipoMaterial);
  const systemInstruction = buildMaterialEngineSystemInstruction(
    request.tipoMaterial,
  );
  const basePrompt = buildMaterialEnginePrompt(request);
  const maxOutputTokens = maxOutputTokensFor(request.tipoMaterial);

  let activePrompt = basePrompt;
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const generated = await generateGeminiJSON<Partial<MaterialEngineResponse>>({
        systemInstruction,
        prompt: activePrompt,
        temperature: 0.32,
        topP: 0.86,
        maxOutputTokens,
        responseSchema: schema,
      });

      const normalized = normalizeOutput(request, generated);

      if (request.tipoMaterial === "slides" && normalized.slides?.length) {
        normalized.slides = orderSlidesPedagogically(normalized.slides);
        assignSlideSequenceLabels(normalized.slides);
        await enrichSlidesWithImages(normalized.slides, {
          tema: request.tema,
          componente: request.componenteCurricular,
        });
      }

      const issues = getEngineOutputIssues(request, normalized);

      if (issues.length && attempt < 2) {
        activePrompt = `${basePrompt}\n\n${buildQualityRetryPrompt(request, issues)}`;
        continue;
      }

      const html = renderDocumentHtml(request, normalized);

      return {
        ok: true as const,
        status: 200,
        data: {
          tipoMaterial: request.tipoMaterial,
          html,
          estrutura: normalized,
        },
      };
    } catch (error) {
      lastError = error;
    }
  }

  return {
    ok: false as const,
    status: 502,
    message:
      lastError instanceof Error
        ? lastError.message
        : "A IA não conseguiu gerar o material. Tente novamente.",
  };
}
