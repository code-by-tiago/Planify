import { buildVisualGameMaterial } from "@/lib/materiais/game-builder";
import { getModelTierForMaterialRequest } from "@/lib/ai/material-generation-policy";
import { GENERATION_SERVER_DEADLINE_MS, GENERATION_FAST_DEADLINE_MS, MATERIAL_GEMINI_CALL_TIMEOUT_MS, createGenerationTimeoutError } from "@/lib/pro/generation-timeout";
import { computeQualityScore } from "@/lib/materiais/material-quality-score";
import { isGenericEducationalText } from "@/lib/materiais/material-semantic-quality";
import {
  normalizeQuestionOptions,
  trimTeachyStatement,
  renderCronogramaTables,
  renderGabaritoTable,
  renderQuestionCard,
  wrapProfessionalDocument,
} from "@/lib/materiais/material-document-layout";
import { generateGeminiJSON, isGeminiQuotaError, resolveGeminiFailureCode } from "../ai/gemini-client";
import {
  usesDedicatedEngineRenderer,
  usesPlanifyMaterialEngine,
} from "./planify-material-routing";
import { shouldRepairExamAfterEngine } from "./question-bank-first-policy";
import {
  materialLayoutToEngineResponse,
  toPromptEngineInput,
} from "./material-layout-adapter";
import { getMaterialLayoutSchema } from "./material-layout-schema";
import { buildPromptEngine } from "./promptEngine";
import {
  buildQualityRetryPrompt,
  getEngineOutputIssues,
} from "./material-engine-quality";
import {
  buildPedagogicalOutlinePromptBlock,
  usesPedagogicalOutline,
} from "./material-pedagogical-outline";
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
import { resolveSlideTheme, type SlideTheme } from "./slide-design-themes";
import {
  computeSlideBodyFontSize,
  computeSlideFigureMaxHeight,
  computeSlideTitleFontSize,
  SLIDE_MIN_BODY_FONT,
} from "@/lib/slides/slide-typography";
import { enrichSlidesWithImages } from "./slide-image-resolver";
import {
  assignSlideSequenceLabels,
  consolidateSlideGabarito,
  orderSlidesPedagogically,
} from "./slide-pedagogy";
import type { MaterialLayout } from "./types";
import { validateMaterialLayout } from "./validator";

const CRITICAL_QUALITY_TYPES = new Set<MaterialEngineType>([
  "prova",
  "lista",
  "apostila",
  "atividade",
  "plano-aula",
  "slides",
]);

/** All 13 geradores passam pelo gate P0 antes da entrega final. */
const P0_QUALITY_GATE_TYPES = new Set<MaterialEngineType>([
  "apostila",
  "atividade",
  "prova",
  "slides",
  "projeto",
  "jogo",
  "sequencia",
  "resumo",
  "lista",
  "plano-aula",
  "flashcards",
  "redacao",
  "mapa-mental",
]);

/** Mínimo para entrega sem alerta crítico — acima do piso Teachy (80). */
const MIN_P0_QUALITY_SCORE = 88;

const GENERATION_DEADLINE_MS = GENERATION_SERVER_DEADLINE_MS;
const MAX_EXAM_REPAIR_PASSES = 1;

const CRITICAL_RETRY_TYPES = new Set<MaterialEngineType>([
  "prova",
  "lista",
  "slides",
  "plano-aula",
  "atividade",
  "apostila",
  "sequencia",
  "resumo",
]);

function maxAttemptsFor(
  type: MaterialEngineType,
  elevarQualidade: boolean,
): number {
  if (!elevarQualidade) return 1;

  switch (type) {
    case "prova":
    case "lista":
    case "slides":
    case "apostila":
    case "plano-aula":
    case "sequencia":
    case "projeto":
    case "redacao":
      return 3;
    default:
      return 2;
  }
}

function buildDeliveryAlertas(
  request: MaterialEngineRequest,
  issues: string[],
  isFinalAttempt: boolean,
): string[] | undefined {
  if (!issues.length) return undefined;

  if (CRITICAL_QUALITY_TYPES.has(request.tipoMaterial) && isFinalAttempt) {
    const attempts = maxAttemptsFor(request.tipoMaterial, Boolean(request.elevarQualidade));
    return [
      `Passo crítico: a IA não resolveu todos os critérios após ${attempts} tentativas.`,
      "Regenere o material ou use Elevar qualidade antes de imprimir ou aplicar em sala.",
      ...issues.slice(0, 8),
    ];
  }

  return [
    "Revise o material antes de aplicar em sala — alguns critérios de qualidade ainda precisam de ajuste.",
    ...issues.slice(0, 8),
  ];
}

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

function renderSections(response: MaterialEngineResponse, ctx?: RenderContext): string {
  const tipo = ctx?.tipo;
  const concise = tipo === "resumo";

  return response.sections
    .map(
      (section) => `
        <section class="${concise ? "planify-resumo-section" : ""}">
          <h2>${escapeHtml(section.title)}</h2>
          ${!concise && section.content ? `<p>${escapeHtml(section.content)}</p>` : ""}
          ${concise && section.content && section.content.length <= 120 ? `<p class="planify-resumo-lead">${escapeHtml(section.content)}</p>` : ""}
          ${asList(section.bullets || [])}
        </section>
      `,
    )
    .join("");
}

function renderActivities(response: MaterialEngineResponse): string {
  if (!response.activities.length) return "";
  return `
    <section class="planify-atividades-block">
      <h2>Atividades</h2>
      ${response.activities
        .map(
          (activity) => `
            <article class="planify-atividade-card">
              <h3>${escapeHtml(activity.title)}</h3>
              ${activity.objective ? `<p><strong>Objetivo:</strong> ${escapeHtml(activity.objective)}</p>` : ""}
              ${activity.estimatedTime ? `<p><strong>Tempo estimado:</strong> ${escapeHtml(activity.estimatedTime)}</p>` : ""}
              ${
                activity.materials?.length
                  ? `<p><strong>Materiais necessários:</strong></p>${asList(activity.materials)}`
                  : ""
              }
              ${activity.instructions ? `<p><strong>Desenvolvimento:</strong> ${escapeHtml(activity.instructions)}</p>` : ""}
              ${asList(activity.items || [])}
              ${activity.evaluation ? `<p><strong>Avaliação:</strong> ${escapeHtml(activity.evaluation)}</p>` : ""}
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
  tema?: string;
  request?: MaterialEngineRequest;
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
  const itemLabel = tipo === "lista" ? "Exercício" : "Questão";

  const body = questions
    .map((question) =>
      renderQuestionCard({
        number: question.number,
        statement: question.statement,
        options: question.options,
        questionType: question.type,
        label: itemLabel,
        compact: true,
      }),
    )
    .join("");

  return `<section class="planify-questoes-block planify-questoes-block-direct">${body}</section>`;
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

const SLIDE_PICTURE_SVG =
  '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="m21 16-5-5L5 20"/></svg>';

/** Hex bare ("0F172A") → cor CSS ("#0F172A"). */
function h(hex: string): string {
  return `#${hex}`;
}

function fontStack(name: string): string {
  if (name === "Georgia") return "Georgia, 'Times New Roman', serif";
  if (name === "Trebuchet MS") return "'Trebuchet MS', 'Segoe UI', sans-serif";
  if (name === "Calibri") return "Calibri, 'Segoe UI', system-ui, sans-serif";
  return "Arial, Helvetica, sans-serif";
}

/** Decoração visual posicionada (clipada pelo card via overflow:hidden). */
function decorationHtml(theme: SlideTheme, ctx: "cover" | "content"): string {
  const onCover = ctx === "cover";
  const soft = onCover ? "rgba(255,255,255,0.14)" : theme.accentSoftCss;

  switch (theme.decoration) {
    case "blob":
      return `<div style="position:absolute;top:-70px;right:-50px;width:220px;height:220px;border-radius:50%;background:${soft};pointer-events:none;"></div>
        <div style="position:absolute;bottom:-80px;left:-60px;width:190px;height:190px;border-radius:50%;background:${soft};pointer-events:none;"></div>`;
    case "corner":
      return `<div style="position:absolute;top:0;right:0;width:0;height:0;border-top:96px solid ${onCover ? "rgba(255,255,255,0.16)" : theme.accentSoftCss};border-left:96px solid transparent;pointer-events:none;"></div>`;
    case "dots":
      return `<div style="position:absolute;inset:0;background-image:radial-gradient(${onCover ? "rgba(255,255,255,0.18)" : "rgba(15,23,42,0.06)"} 1.5px,transparent 1.6px);background-size:18px 18px;pointer-events:none;"></div>`;
    case "chalk":
      return `<div style="position:absolute;inset:10px;border:1.5px dashed ${onCover ? "rgba(248,250,252,0.35)" : `${h(theme.accentHex)}55`};border-radius:14px;pointer-events:none;"></div>`;
    case "line":
      return `<div style="position:absolute;top:0;left:0;height:6px;width:100%;background:${h(theme.accentHex)};pointer-events:none;"></div>`;
    default:
      return "";
  }
}

function slideHeaderHtml(theme: SlideTheme, tag: string, position: string): string {
  const label = `font-size:12px;font-weight:800;letter-spacing:0.08em;`;
  const pos = `font-size:12px;font-weight:700;color:${h(theme.mutedInk)};`;

  switch (theme.headerKind) {
    case "ribbon":
      return `<div style="display:flex;align-items:center;justify-content:space-between;margin:-22px -26px 16px;padding:11px 26px;background:${h(theme.accentHex)};color:#ffffff;">
          <span style="${label}">${tag}</span><span style="${label}opacity:0.85;">${position}</span>
        </div>`;
    case "block":
      return `<div style="display:flex;align-items:center;justify-content:space-between;margin:0 0 14px;">
          <span style="${label}display:inline-block;background:${h(theme.accentHex)};color:#ffffff;padding:5px 12px;border-radius:8px;">${tag}</span>
          <span style="${pos}">${position}</span>
        </div>`;
    case "underline":
      return `<div style="display:flex;align-items:flex-end;justify-content:space-between;margin:0 0 14px;border-bottom:2px solid ${h(theme.accentHex)};padding-bottom:8px;">
          <span style="${label}color:${h(theme.accentHex)};">${tag}</span><span style="${pos}">${position}</span>
        </div>`;
    case "chalk":
      return `<div style="display:flex;align-items:center;justify-content:space-between;margin:0 0 14px;">
          <span style="${label}color:${h(theme.accentHex)};border-bottom:2px dashed ${h(theme.accentHex)};padding-bottom:4px;">${tag}</span>
          <span style="${pos}">${position}</span>
        </div>`;
    default:
      return `<div style="display:flex;align-items:center;justify-content:space-between;margin:0 0 14px;">
          <span style="${label}color:${h(theme.accentHex)};">${tag}</span><span style="${pos}">${position}</span>
        </div>`;
  }
}

function slideBulletsHtml(bullets: string[], theme: SlideTheme, fontSize?: number): string {
  const clean = bullets.filter((item) => item.trim());
  if (!clean.length) return "";
  const size = fontSize ?? computeSlideBodyFontSize({ bullets: clean });
  return `<ul style="margin:0;padding:0;list-style:none;">${clean
    .map(
      (item) =>
        `<li style="display:flex;gap:9px;margin:9px 0;font-family:${fontStack(theme.fontBody)};font-size:${size}px;line-height:1.5;color:${h(theme.bodyInk)};"><span style="color:${h(theme.accentHex)};font-weight:900;line-height:1.4;">▪</span><span>${escapeHtml(item)}</span></li>`,
    )
    .join("")}</ul>`;
}

function slideFigureHtml(
  slide: { imageUrl?: string; imageAlt?: string; imagePrompt?: string },
  theme: SlideTheme,
  maxHeight?: number,
): string {
  const figureMaxHeight = maxHeight ?? 240;
  if (slide.imageUrl?.trim()) {
    const alt = escapeHtml(slide.imageAlt || slide.imagePrompt || "Ilustração do slide");
    return `<figure class="planify-slide-figure" data-planify-slide-image="true" style="margin:0;border-radius:14px;overflow:hidden;border:${theme.cardBorderCss};background:${theme.accentSoftCss};">
      <img src="${escapeHtml(slide.imageUrl)}" alt="${alt}" class="planify-slide-image" data-planify-image="true" style="display:block;width:100%;max-height:${figureMaxHeight}px;object-fit:contain;cursor:pointer;" />
    </figure>`;
  }

  if (!slide.imagePrompt?.trim()) return "";

  return `<figure class="planify-slide-figure planify-slide-figure--pending" data-planify-slide-image="true" style="margin:0;border-radius:14px;overflow:hidden;border:1px dashed ${h(theme.accentHex)};background:${theme.accentSoftCss};padding:14px;text-align:center;">
      <span style="display:inline-flex;align-items:center;justify-content:center;width:42px;height:42px;border-radius:10px;background:${theme.cardBgCss};color:${h(theme.accentHex)};">${SLIDE_PICTURE_SVG}</span>
      <p style="margin:8px 0 0;font-size:11px;font-weight:700;color:${h(theme.mutedInk)};">Clique em Imagem no editor para adicionar uma ilustração</p>
    </figure>`;
}

function slideCalloutHtml(
  callout: { title?: string; text?: string } | undefined,
  theme: SlideTheme,
  bodyFontSize?: number,
): string {
  if (!callout || !callout.text) return "";
  const bodySize = bodyFontSize ?? SLIDE_MIN_BODY_FONT;
  return `<div style="margin-top:14px;border-left:4px solid ${h(theme.accentHex)};background:${theme.accentSoftCss};border-radius:0 12px 12px 0;padding:12px 16px;">
      ${callout.title ? `<p style="margin:0 0 4px;font-family:${fontStack(theme.fontHeading)};font-size:${Math.max(14, bodySize - 2)}px;font-weight:800;color:${h(theme.accentHex)};">★ ${escapeHtml(callout.title)}</p>` : ""}
      <p style="margin:0;font-family:${fontStack(theme.fontBody)};font-size:${Math.max(SLIDE_MIN_BODY_FONT, bodySize - 1)}px;line-height:1.5;color:${h(theme.bodyInk)};">${escapeHtml(callout.text)}</p>
    </div>`;
}

function slideNotesHtml(notes: string, theme: SlideTheme): string {
  if (!notes) return "";
  return `<div style="margin-top:14px;padding:11px 14px;background:${theme.accentSoftCss};border-left:3px solid ${h(theme.accentHex)};border-radius:8px;">
      <span style="display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${h(theme.accentHex)};margin-bottom:4px;">Notas do professor</span>
      <span style="font-family:${fontStack(theme.fontBody)};font-size:13px;line-height:1.55;color:${h(theme.mutedInk)};">${escapeHtml(notes)}</span>
    </div>`;
}

function renderSlides(response: MaterialEngineResponse): string {
  const rawSlides = response.slides ?? [];
  if (!rawSlides.length) return "";

  const theme = resolveSlideTheme(response.slideTheme);
  const slides = orderSlidesPedagogically([...rawSlides]);
  assignSlideSequenceLabels(slides);

  const total = slides.length;
  const contentTotal = slides.filter(
    (s) => s.layout !== "capa" && s.layout !== "fechamento",
  ).length;
  let contentCounter = 0;

  const cardShadow = theme.dark
    ? "0 18px 40px -20px rgba(0,0,0,0.6)"
    : "0 12px 32px -20px rgba(15,23,42,0.45)";

  const body = slides
    .map((slide, index) => {
      const isFirst = index === 0;
      const isLast = index === total - 1;
      const layout =
        slide.layout ?? (isFirst ? "capa" : isLast ? "fechamento" : "conteudo");
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
        const label = slide.sequenceLabel || `Etapa ${contentCounter}`;
        tag = label.toUpperCase();
        positionLabel = `${contentCounter} / ${contentTotal}`;
      }

      if (layout === "capa") {
        return `
          <div class="planify-slide" style="position:relative;overflow:hidden;margin:0 0 22px;border-radius:18px;background:${theme.coverBgCss};color:${h(theme.coverInk)};box-shadow:0 18px 44px -22px rgba(15,23,42,0.6);">
            ${decorationHtml(theme, "cover")}
            <div style="position:relative;padding:42px 36px;">
              <span style="display:inline-block;font-size:11px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;background:${theme.coverBadgeBg};color:${h(theme.coverBadgeInk)};padding:6px 13px;border-radius:999px;">Planify · Apresentação</span>
              <h3 style="margin:18px 0 0;font-family:${fontStack(theme.fontHeading)};font-size:40px;font-weight:900;line-height:1.16;color:${h(theme.coverInk)};">${escapeHtml(slide.title)}</h3>
              ${slide.subtitle ? `<p style="margin:14px 0 0;font-family:${fontStack(theme.fontBody)};font-size:22px;font-weight:500;line-height:1.5;color:${h(theme.coverMutedInk)};">${escapeHtml(slide.subtitle)}</p>` : ""}
              <p style="margin:22px 0 0;font-size:12px;font-weight:700;letter-spacing:0.08em;color:${h(theme.coverMutedInk)};">${total} SLIDES</p>
            </div>
          </div>
        `;
      }

      const header = slideHeaderHtml(theme, tag, positionLabel || `${index + 1} / ${total}`);
      const accentBorder =
        theme.headerKind === "bar"
          ? `border-left:5px solid ${h(theme.accentHex)};padding-left:12px;`
          : "";
      const bodyFontSize = computeSlideBodyFontSize({
        bullets,
        hasImage: Boolean(slide.imageUrl?.trim() || slide.imagePrompt?.trim()),
        hasCallout: Boolean(slide.callout?.text),
      });
      const titleFontSize = computeSlideTitleFontSize(bodyFontSize);
      const figureMaxHeight = computeSlideFigureMaxHeight({
        bulletCount: bullets.length,
        hasCallout: Boolean(slide.callout?.text),
      });
      const titleHtml = `<h3 style="margin:0 0 14px;font-family:${fontStack(theme.fontHeading)};font-size:${titleFontSize}px;font-weight:800;color:${h(theme.titleInk)};line-height:1.25;${accentBorder}">${escapeHtml(slide.title)}</h3>`;

      const bulletsHtml = slideBulletsHtml(bullets, theme, bodyFontSize);
      const figureHtml = slideFigureHtml(slide, theme, figureMaxHeight);
      const calloutHtml = slideCalloutHtml(slide.callout, theme, bodyFontSize);
      const notesHtml = slideNotesHtml(slide.speakerNotes, theme);
      const imageBlock = figureHtml
        ? `<div style="margin-top:16px;max-width:100%;">${figureHtml}</div>`
        : "";

      let inner = "";

      if (layout === "duasColunas") {
        inner = `${titleHtml}${bulletsHtml}${imageBlock}${calloutHtml}${notesHtml}`;
      } else if (layout === "destaque") {
        const bigCallout = slide.callout?.text
          ? `<div style="margin:0 0 14px;text-align:center;background:${theme.accentSoftCss};border:${theme.cardBorderCss};border-radius:14px;padding:22px;">
               ${slide.callout.title ? `<p style="margin:0 0 8px;font-size:${Math.max(14, bodyFontSize - 2)}px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:${h(theme.accentHex)};">${escapeHtml(slide.callout.title)}</p>` : ""}
               <p style="margin:0;font-family:${fontStack(theme.fontHeading)};font-size:${Math.max(SLIDE_MIN_BODY_FONT, bodyFontSize)}px;font-weight:700;line-height:1.4;color:${h(theme.titleInk)};">${escapeHtml(slide.callout.text)}</p>
             </div>`
          : "";
        inner = `${titleHtml}${bigCallout}${bulletsHtml}${imageBlock}${notesHtml}`;
      } else if (layout === "fechamento") {
        inner = `${titleHtml}
          ${slide.subtitle ? `<p style="margin:0 0 12px;font-family:${fontStack(theme.fontBody)};font-size:${Math.max(SLIDE_MIN_BODY_FONT, bodyFontSize - 1)}px;font-weight:600;color:${h(theme.accentHex)};">${escapeHtml(slide.subtitle)}</p>` : ""}
          ${bulletsHtml}${imageBlock}${calloutHtml}${notesHtml}`;
      } else {
        inner = `${titleHtml}${bulletsHtml}${imageBlock}${calloutHtml}${notesHtml}`;
      }

      const leftBar =
        theme.headerKind === "bar"
          ? `<div style="position:absolute;top:0;left:0;width:6px;height:100%;background:${h(theme.accentHex)};pointer-events:none;"></div>`
          : "";

      return `
        <div class="planify-slide" style="position:relative;overflow:hidden;margin:0 0 22px;border:${theme.cardBorderCss};border-radius:18px;background:${theme.cardBgCss};box-shadow:${cardShadow};">
          ${decorationHtml(theme, "content")}
          ${leftBar}
          <div style="position:relative;padding:24px 26px 26px;">${header}${inner}</div>
        </div>
      `;
    })
    .join("");

  return `
    <section
      class="planify-slide-deck"
      data-planify-slide-theme="${theme.id}"
      style="background:${theme.pageBgCss};padding:12px 8px 4px;border-radius:16px;"
    >
      <p style="margin:0 0 14px;font-size:12px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:${h(theme.accentHex)};">
        Apresentação · ${total} slides · Tema ${escapeHtml(theme.label)}
      </p>
      ${body}
    </section>
  `.trim();
}

const FLASHCARD_PALETTE = [
  { strong: "#4f46e5", base: "#6366f1", soft: "#eef2ff", ink: "#3730a3" },
  { strong: "#0284c7", base: "#0ea5e9", soft: "#f0f9ff", ink: "#075985" },
  { strong: "#059669", base: "#10b981", soft: "#ecfdf5", ink: "#065f46" },
  { strong: "#d97706", base: "#f59e0b", soft: "#fffbeb", ink: "#92400e" },
  { strong: "#e11d48", base: "#f43f5e", soft: "#fff1f2", ink: "#9f1239" },
  { strong: "#7c3aed", base: "#8b5cf6", soft: "#f5f3ff", ink: "#5b21b6" },
];

function renderFlashcards(response: MaterialEngineResponse): string {
  const flashcards = (response.flashcards ?? []).filter(
    (card) => card.front?.trim() || card.back?.trim(),
  );
  if (!flashcards.length) return "";

  const body = flashcards
    .map((card, index) => {
      const c = FLASHCARD_PALETTE[index % FLASHCARD_PALETTE.length];
      return `
        <article class="planify-flashcard" style="display:flex;flex-direction:column;flex:1 1 260px;min-width:240px;max-width:340px;border:1px solid ${c.base}33;border-radius:16px;overflow:hidden;background:#ffffff;box-shadow:0 10px 26px -18px ${c.base};">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 16px;background:linear-gradient(135deg,${c.strong},${c.base});color:#ffffff;">
            <span style="font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;">Pergunta</span>
            <span style="display:inline-flex;align-items:center;justify-content:center;min-width:24px;height:24px;padding:0 7px;border-radius:999px;background:rgba(255,255,255,0.22);font-size:12px;font-weight:800;">${index + 1}</span>
          </div>
          <div style="padding:16px;font-size:15px;font-weight:800;line-height:1.45;color:#0f172a;">${escapeHtml(card.front)}</div>
          <div style="display:flex;align-items:center;gap:8px;padding:0 16px;">
            <span style="height:1px;flex:1;background:${c.base}33;"></span>
            <span style="font-size:10px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:${c.ink};">Resposta</span>
            <span style="height:1px;flex:1;background:${c.base}33;"></span>
          </div>
          <div style="padding:12px 16px 18px;font-size:14px;line-height:1.55;color:#475569;background:${c.soft};flex:1;">${escapeHtml(card.back)}</div>
        </article>
      `;
    })
    .join("");

  return `
    <section class="planify-flashcards">
      <h2>Flashcards</h2>
      <p style="margin:0 0 14px;font-size:13px;color:#64748b;">${flashcards.length} cartões — pergunta em destaque e resposta abaixo. Imprima e recorte para estudo ou revisão em sala.</p>
      <div style="display:flex;flex-wrap:wrap;gap:16px;align-items:stretch;">${body}</div>
    </section>
  `;
}

function renderMindMap(response: MaterialEngineResponse): string {
  const mindMap = response.mindMap;
  if (!mindMap || !mindMap.branches.length) return "";

  const branches = mindMap.branches.filter((branch) => branch.title?.trim());
  if (!branches.length) return "";

  const cx = 320;
  const cy = 210;
  const radius = 150;
  const branchCount = branches.length;

  const branchNodes = branches
    .map((branch, index) => {
      const c = FLASHCARD_PALETTE[index % FLASHCARD_PALETTE.length];
      const angle = (Math.PI * 2 * index) / branchCount - Math.PI / 2;
      const bx = Math.round(cx + Math.cos(angle) * radius);
      const by = Math.round(cy + Math.sin(angle) * radius);
      const items = (branch.items || []).filter((item) => item.trim());
      const chips = items
        .map(
          (item) =>
            `<span class="planify-mindmap-chip" style="display:inline-block;margin:3px 4px 0 0;padding:5px 11px;border-radius:999px;background:${c.soft};border:1px solid ${c.base}33;font-size:12px;font-weight:600;color:${c.ink};">${escapeHtml(item)}</span>`,
        )
        .join("");

      return {
        c,
        bx,
        by,
        chips,
        title: escapeHtml(branch.title),
        index,
      };
    });

  const connectors = branchNodes
    .map(
      (node) =>
        `<path d="M ${cx} ${cy} Q ${Math.round((cx + node.bx) / 2)} ${Math.round((cy + node.by) / 2)} ${node.bx} ${node.by}" fill="none" stroke="${node.c.base}55" stroke-width="2.5" stroke-linecap="round"/>`,
    )
    .join("");

  const branchCards = branchNodes
    .map(
      (node) => `
        <foreignObject x="${node.bx - 118}" y="${node.by - 58}" width="236" height="116">
          <div xmlns="http://www.w3.org/1999/xhtml" class="planify-mindmap-branch" style="height:100%;border:1px solid ${node.c.base}33;border-top:4px solid ${node.c.base};border-radius:14px;padding:12px 14px;background:#ffffff;box-shadow:0 10px 26px -20px ${node.c.base};">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
              <span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:999px;background:${node.c.strong};color:#fff;font-size:11px;font-weight:800;">${node.index + 1}</span>
              <h3 style="margin:0;font-size:14px;font-weight:800;color:#0f172a;line-height:1.25;">${node.title}</h3>
            </div>
            <div>${node.chips}</div>
          </div>
        </foreignObject>
      `,
    )
    .join("");

  const listFallback = branches
    .map((branch, index) => {
      const c = FLASHCARD_PALETTE[index % FLASHCARD_PALETTE.length];
      const items = (branch.items || []).filter((item) => item.trim());
      const chips = items
        .map(
          (item) =>
            `<span style="display:inline-block;margin:3px 4px 0 0;padding:5px 11px;border-radius:999px;background:${c.soft};border:1px solid ${c.base}33;font-size:12px;font-weight:600;color:${c.ink};">${escapeHtml(item)}</span>`,
        )
        .join("");
      return `
        <div class="planify-mindmap-branch" style="flex:1 1 240px;min-width:220px;border:1px solid ${c.base}33;border-top:4px solid ${c.base};border-radius:14px;padding:14px 16px;background:#ffffff;">
          <h3 style="margin:0 0 8px;font-size:15px;font-weight:800;color:#0f172a;">${escapeHtml(branch.title)}</h3>
          <div>${chips}</div>
        </div>
      `;
    })
    .join("");

  return `
    <section class="planify-mindmap">
      <h2>Mapa mental</h2>
      <div class="planify-mindmap-radial" style="margin:16px 0;">
        <svg viewBox="0 0 640 420" role="img" aria-label="Mapa mental radial" style="width:100%;max-width:720px;margin:0 auto;display:block;">
          <defs>
            <radialGradient id="planify-mindmap-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#818cf8" stop-opacity="0.35"/>
              <stop offset="100%" stop-color="#818cf8" stop-opacity="0"/>
            </radialGradient>
          </defs>
          <circle cx="${cx}" cy="${cy}" r="188" fill="url(#planify-mindmap-glow)"/>
          ${connectors}
          <circle cx="${cx}" cy="${cy}" r="72" fill="#4f46e5" stroke="#312e81" stroke-width="2"/>
          <foreignObject x="${cx - 90}" y="${cy - 36}" width="180" height="72">
            <div xmlns="http://www.w3.org/1999/xhtml" style="height:100%;display:flex;align-items:center;justify-content:center;text-align:center;padding:8px;">
              <p style="margin:0;font-size:15px;font-weight:900;line-height:1.2;color:#ffffff;">${escapeHtml(mindMap.central)}</p>
            </div>
          </foreignObject>
          ${branchCards}
        </svg>
        <div class="planify-mindmap-fallback" style="display:none;flex-wrap:wrap;gap:16px;margin-top:12px;">
          ${listFallback}
        </div>
      </div>
      <p style="margin:12px 0 0;font-size:13px;color:#64748b;">Cada ramo articula subtópicos ao conceito central — conduza a discussão partindo do centro para as ramificações.</p>
    </section>
  `;
}

function conciseGabaritoAnswer(text: string, maxLen = 180): string {
  const trimmed = String(text || "").replace(/\s+/g, " ").trim();
  if (!trimmed) return "";
  if (trimmed.length <= maxLen) return trimmed;
  const slice = trimmed.slice(0, maxLen);
  const lastSpace = slice.lastIndexOf(" ");
  return `${(lastSpace > 60 ? slice.slice(0, lastSpace) : slice).trim()}…`;
}

function parseGabaritoEntry(
  line: string,
  fallbackNumber: number,
): { number: number | string; answer: string } {
  const match = line.match(/^(?:exerc[ií]cio|quest[aã]o)\s*(\d+)\s*:\s*(.+)$/i);
  if (match) {
    return { number: Number(match[1]), answer: conciseGabaritoAnswer(match[2]) };
  }
  return { number: fallbackNumber, answer: conciseGabaritoAnswer(line) };
}

function renderAnswerKey(response: MaterialEngineResponse, ctx?: RenderContext): string {
  if (!ctx?.incluirGabarito) return "";

  const byNumber = new Map<number, string>();

  for (const question of response.exam?.questions ?? []) {
    const answer = conciseGabaritoAnswer(question.answer || "");
    if (!answer) continue;
    byNumber.set(Number(question.number), answer);
  }

  let fallbackIndex = 1;
  for (const line of response.answerKey) {
    const parsed = parseGabaritoEntry(line, fallbackIndex);
    const num = Number(parsed.number);
    if (!byNumber.has(num)) {
      byNumber.set(num, parsed.answer);
    }
    fallbackIndex += 1;
  }

  const entries = [...byNumber.entries()]
    .sort(([a], [b]) => a - b)
    .map(([number, answer]) => ({ number, answer }));

  return renderGabaritoTable(entries);
}

function renderTeacherNotes(response: MaterialEngineResponse): string {
  if (!response.teacherNotes.length) return "";
  return `<section><h2>Notas para o professor</h2>${asList(response.teacherNotes)}</section>`;
}

function renderHtml(response: MaterialEngineResponse, ctx?: RenderContext): string {
  const tipo = ctx?.tipo;
  const dedicatedRenderer = tipo ? usesDedicatedEngineRenderer(tipo) : false;

  // A IA às vezes preenche `html` cru — só aceitar em tipos leves fora do render dedicado.
  if (
    !dedicatedRenderer &&
    tipo &&
    !usesPlanifyMaterialEngine(tipo) &&
    response.html &&
    /<[a-z][\s\S]*>/i.test(response.html)
  ) {
    return response.html;
  }

  const blocks =
    tipo === "slides"
      ? [
          renderSlides(response),
          renderTeacherNotes(response),
        ]
      : tipo === "flashcards"
        ? [renderFlashcards(response), renderTeacherNotes(response)]
        : tipo === "mapa-mental"
          ? [renderMindMap(response), renderTeacherNotes(response)]
          : tipo === "prova" || tipo === "lista"
            ? [renderExam(response, ctx), renderAnswerKey(response, ctx)]
            : tipo === "resumo"
              ? [
                  renderSections(response, ctx),
                  renderActivities(response),
                ]
              : tipo === "plano-aula" || tipo === "sequencia" || tipo === "projeto"
                ? [
                    renderSections(response, ctx),
                    renderCronogramaTables(response),
                    renderActivities(response),
                    renderAnswerKey(response, ctx),
                    renderTeacherNotes(response),
                  ]
                : [
                  renderSections(response, ctx),
                  renderCronogramaTables(response),
                  renderMindMap(response),
                  renderSlides(response),
                  renderGame(response),
                  renderFlashcards(response),
                  renderExam(response, ctx),
                  renderActivities(response),
                  renderAnswerKey(response, ctx),
                  renderTeacherNotes(response),
                ];

  const joined = blocks.filter(Boolean).join("");

  if (tipo === "slides" || tipo === "flashcards" || tipo === "mapa-mental") {
    return `
      <article class="planify-doc planify-doc-visual">
        <h1>${escapeHtml(response.title)}</h1>
        ${response.subtitle ? `<p class="planify-doc-subtitle">${escapeHtml(response.subtitle)}</p>` : ""}
        ${response.summary ? `<p class="planify-doc-summary">${escapeHtml(response.summary)}</p>` : ""}
        ${joined}
      </article>
    `.trim();
  }

  return wrapProfessionalDocument(
    {
      title: response.title,
      subtitle: response.subtitle,
      summary: response.summary,
      tipo: tipo || "material",
      tema: ctx?.tema || response.title,
      request: ctx?.request,
    },
    joined,
  );
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
          objective: String(activity?.objective || ""),
          estimatedTime: String(activity?.estimatedTime || ""),
          materials: Array.isArray(activity?.materials)
            ? activity.materials.map((item) => String(item))
            : [],
          instructions: String(activity?.instructions || ""),
          items: Array.isArray(activity?.items)
            ? activity.items.map((item) => String(item))
            : [],
          evaluation: String(activity?.evaluation || ""),
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
                options: normalizeQuestionOptions(
                  Array.isArray(question?.options)
                    ? question.options.map((item) => String(item))
                    : [],
                ),
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
    scheduleTables: Array.isArray(response.scheduleTables)
      ? response.scheduleTables
          .map((table) => ({
            title: String(table?.title || "Cronograma").trim(),
            headers: Array.isArray(table?.headers)
              ? table.headers.map((header) => String(header).trim()).filter(Boolean)
              : [],
            rows: Array.isArray(table?.rows)
              ? table.rows
                  .map((row) =>
                    Array.isArray(row)
                      ? row.map((cell) => String(cell ?? "").trim())
                      : [],
                  )
                  .filter((row) => row.some((cell) => cell.length > 0))
              : [],
          }))
          .filter((table) => table.headers.length > 0 && table.rows.length > 0)
      : undefined,
    html:
      usesPlanifyMaterialEngine(request.tipoMaterial) ||
      typeof response.html !== "string"
        ? undefined
        : response.html,
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

  if (request.tipoMaterial === "prova" || request.tipoMaterial === "lista") {
    const summary = normalized.summary.trim();
    if (!summary || isGenericEducationalText(summary) || summary.length > 120) {
      normalized.summary = "";
    }
    normalized.sections = [];
    normalized.teacherNotes = [];
    normalized.activities = [];
    if (normalized.exam?.questions.length) {
      normalized.exam.questions = normalized.exam.questions.map((question, index) => {
        let statement = trimTeachyStatement(String(question.statement || ""));
        const num = question.number || index + 1;
        statement = statement
          .replace(
            new RegExp(`^\\s*(?:quest[aã]o|exerc[ií]cio)\\s*${num}\\s*[:.)-]?\\s*`, "i"),
            "",
          )
          .replace(new RegExp(`^\\s*${String(num).padStart(2, "0")}\\s+\\w+\\s*`, "i"), "")
          .trim();
        statement = trimTeachyStatement(statement);
        return {
          ...question,
          statement,
          answer: request.incluirGabarito
            ? conciseGabaritoAnswer(question.answer)
            : "",
        };
      });
      const itemLabel = request.tipoMaterial === "lista" ? "Exercício" : "Questão";
      normalized.answerKey = normalized.answerKey.map((line, index) => {
        const parsed = parseGabaritoEntry(line, index + 1);
        return `${itemLabel} ${parsed.number}: ${parsed.answer}`;
      });
    }
  }

  if (request.tipoMaterial === "resumo") {
    normalized.teacherNotes = [];
    if (normalized.exam) {
      normalized.exam = { questions: [] };
    }
    normalized.answerKey = [];
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
    tema: request.tema,
    request,
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

function maxOutputTokensFor(
  type: MaterialEngineType,
  quantidade = 10,
): number {
  if (type === "slides") return 24000;
  if (type === "flashcards" || type === "mapa-mental") return 14000;
  if (type === "resumo" || type === "atividade" || type === "jogo") return 16000;
  if (type === "prova" || type === "lista" || type === "apostila") {
    return Math.min(32_000, 8_000 + Math.max(1, quantidade) * 600);
  }
  return 12000;
}

/** Smoke/offline: monta HTML a partir de estrutura já normalizada (scripts de verificação). */
export function buildMaterialEngineHtmlFromStructure(
  input: MaterialEngineInput,
  structure: Partial<MaterialEngineResponse>,
): string {
  const request = normalizeMaterialEngineRequest(input);
  const normalized = normalizeOutput(request, structure);
  return renderDocumentHtml(request, normalized);
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

  const fastMode = !request.elevarQualidade;
  const modelTier = request.elevarQualidade
    ? getModelTierForMaterialRequest(request.tipoMaterial, request)
    : "default";

  const promptInput = toPromptEngineInput(request);
  const { systemInstruction, userPrompt } = buildPromptEngine(promptInput);
  const schema = getMaterialLayoutSchema();
  let outlineBlock = "";

  if (
    !fastMode &&
    modelTier === "advanced" &&
    usesPedagogicalOutline(request.tipoMaterial)
  ) {
    try {
      outlineBlock = await buildPedagogicalOutlinePromptBlock(request);
    } catch {
      outlineBlock = "";
    }
  }

  const basePrompt = outlineBlock
    ? `${userPrompt}\n\n${outlineBlock}`
    : userPrompt;
  const maxOutputTokens = maxOutputTokensFor(
    request.tipoMaterial,
    request.quantidade,
  );

  let activePrompt = basePrompt;
  let lastError: unknown = null;
  let lastBestEffort: {
    html: string;
    normalized: MaterialEngineResponse;
    issues: string[];
    qualityScore: number;
    alertas?: string[];
  } | null = null;

  const maxAttempts = maxAttemptsFor(request.tipoMaterial, Boolean(request.elevarQualidade));
  const generationStartedAt = Date.now();
  const generationBudgetMs = fastMode
    ? GENERATION_FAST_DEADLINE_MS
    : GENERATION_DEADLINE_MS;
  const generationDeadlineAt = generationStartedAt + generationBudgetMs;
  const geminiCallTimeoutMs = fastMode
    ? MATERIAL_GEMINI_CALL_TIMEOUT_MS
    : undefined;
  const isPastGenerationDeadline = () => Date.now() >= generationDeadlineAt;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (isPastGenerationDeadline()) {
      if (lastBestEffort) {
        return {
          ok: true as const,
          status: 200,
          data: {
            tipoMaterial: request.tipoMaterial,
            html: lastBestEffort.html,
            estrutura: lastBestEffort.normalized,
            qualityScore: lastBestEffort.qualityScore,
            qualityIssues: lastBestEffort.issues,
            pipeline: request.elevarQualidade ? "engine-elevated" : "engine",
            ...(lastBestEffort.alertas ? { alertas: lastBestEffort.alertas } : {}),
          },
        };
      }

      return {
        ok: false as const,
        status: 504,
        message: createGenerationTimeoutError("material").message,
        errorCode: "timeout",
      };
    }

    try {
      const attemptTier = request.elevarQualidade ? "advanced" : "default";
      const layoutRaw = await generateGeminiJSON<MaterialLayout>({
        systemInstruction,
        prompt: activePrompt,
        cacheProfile: `material-engine:${request.tipoMaterial}`,
        tier: attemptTier,
        temperature: attemptTier === "advanced" ? 0.22 : 0.32,
        topP: attemptTier === "advanced" ? 0.82 : 0.86,
        maxOutputTokens,
        responseSchema: schema,
        deadlineAt: generationDeadlineAt,
        callTimeoutMs: geminiCallTimeoutMs,
      });

      const layoutIssues = validateMaterialLayout(promptInput, layoutRaw);
      if (
        !fastMode &&
        layoutIssues.length &&
        attempt < maxAttempts - 1 &&
        !isPastGenerationDeadline()
      ) {
        activePrompt = `${basePrompt}\n\n${buildQualityRetryPrompt(request, layoutIssues, {
          teachyDepth: attempt >= 1,
        })}`;
        continue;
      }

      const generated = materialLayoutToEngineResponse(layoutRaw, request);
      const normalized = normalizeOutput(request, generated);

      if (request.tipoMaterial === "slides" && normalized.slides?.length) {
        normalized.slideTheme = resolveSlideTheme(request.designSlides).id;
        normalized.slides = orderSlidesPedagogically(normalized.slides);
        if (request.incluirQuestoes) {
          consolidateSlideGabarito(normalized.slides, {
            incluirGabarito: request.incluirGabarito,
            exam: normalized.exam,
            answerKey: normalized.answerKey,
          });
        }
        assignSlideSequenceLabels(normalized.slides);
        if (!fastMode) {
          await enrichSlidesWithImages(normalized.slides, {
            tema: request.tema,
            componente: request.componenteCurricular,
          });
        }
      }

      const issues = [...layoutIssues, ...getEngineOutputIssues(request, normalized)];

      if (
        !fastMode &&
        issues.length &&
        attempt < maxAttempts - 1 &&
        !isPastGenerationDeadline()
      ) {
        activePrompt = `${basePrompt}\n\n${buildQualityRetryPrompt(request, issues, {
          teachyDepth: attempt >= 1,
        })}`;
        continue;
      }

      const html = renderDocumentHtml(request, normalized);
      const isFinalAttempt = attempt >= maxAttempts - 1;
      let alertas = buildDeliveryAlertas(request, issues, isFinalAttempt);
      if (
        fastMode &&
        request.tipoMaterial === "slides" &&
        normalized.slides?.some(
          (slide) => slide.layout !== "fechamento" && !slide.imageUrl?.trim(),
        )
      ) {
        const imageNote =
          'Modo rápido: imagens pendentes — use "Resolver imagens pendentes" no preview.';
        alertas = alertas ? [imageNote, ...alertas] : [imageNote];
      }
      const qualityScore = computeQualityScore(issues, alertas ?? []);

      lastBestEffort = {
        html,
        normalized,
        issues,
        qualityScore,
        alertas: alertas ?? undefined,
      };

      if (
        !fastMode &&
        P0_QUALITY_GATE_TYPES.has(request.tipoMaterial) &&
        qualityScore < MIN_P0_QUALITY_SCORE &&
        attempt < maxAttempts - 1 &&
        !isPastGenerationDeadline()
      ) {
        activePrompt = `${basePrompt}\n\n${buildQualityRetryPrompt(
          request,
          [
            ...issues,
            `Score de qualidade ${qualityScore}/100 abaixo do mínimo ${MIN_P0_QUALITY_SCORE} para entrega P0.`,
          ],
          { teachyDepth: true },
        )}`;
        continue;
      }

      let finalNormalized = normalized;
      let finalIssues = issues;
      let finalHtml = html;
      let finalScore = qualityScore;
      let finalAlertas = alertas;

      if (
        !fastMode &&
        shouldRepairExamAfterEngine(request) &&
        finalIssues.length > 0 &&
        (finalNormalized.exam?.questions?.length ?? 0) > 0
      ) {
        const { regenerateWeakExamQuestions } = await import("./exam-questions-retry");
        if (!isPastGenerationDeadline()) {
          try {
            for (
              let repairPass = 0;
              repairPass < MAX_EXAM_REPAIR_PASSES;
              repairPass += 1
            ) {
              const repaired = await regenerateWeakExamQuestions(input, finalNormalized);
              finalNormalized = repaired.estrutura;
              finalIssues = repaired.qualityIssues;
              finalHtml = repaired.html;
              finalScore = repaired.qualityScore;
              finalAlertas = buildDeliveryAlertas(
                request,
                finalIssues,
                isFinalAttempt,
              );

              if (!finalIssues.length || finalScore >= MIN_P0_QUALITY_SCORE) {
                break;
              }
            }
          } catch (repairError) {
            console.warn(
              "[material-engine] exam repair failed:",
              repairError instanceof Error ? repairError.message : repairError,
            );
          }
        }
      }

      return {
        ok: true as const,
        status: 200,
        data: {
          tipoMaterial: request.tipoMaterial,
          html: finalHtml,
          estrutura: finalNormalized,
          qualityScore: finalScore,
          qualityIssues: finalIssues,
          pipeline: request.elevarQualidade ? "engine-elevated" : "engine",
          ...(finalAlertas ? { alertas: finalAlertas } : {}),
        },
      };
    } catch (error) {
      lastError = error;
      const message =
        error instanceof Error ? error.message : "Erro ao gerar material.";
      if (isGeminiQuotaError(message)) {
        break;
      }
      if (message.includes("Créditos de IA esgotados") || message.includes("GEMINI_API_KEY")) {
        break;
      }
      if (isPastGenerationDeadline()) {
        break;
      }
    }
  }

  const failureMessage =
    lastError instanceof Error
      ? lastError.message
      : isPastGenerationDeadline()
        ? createGenerationTimeoutError("material").message
        : "A IA não conseguiu gerar o material. Tente novamente.";

  return {
    ok: false as const,
    status: isPastGenerationDeadline() ? 504 : 502,
    message: failureMessage,
    errorCode: isPastGenerationDeadline()
      ? "timeout"
      : resolveGeminiFailureCode(failureMessage),
  };
}
