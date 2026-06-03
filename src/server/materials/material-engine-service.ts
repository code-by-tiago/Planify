import { generateGeminiJSON } from "../ai/gemini-client";
import { getMaterialEngineSchema } from "./material-engine-schemas";
import {
  buildMaterialEnginePrompt,
  buildMaterialEngineSystemInstruction,
} from "./material-engine-prompts";
import {
  normalizeMaterialEngineRequest,
  validateMaterialEngineRequest,
} from "./material-engine-validation";
import type {
  MaterialEngineInput,
  MaterialEngineRequest,
  MaterialEngineResponse,
  MaterialEngineType,
} from "./material-engine-types";

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

function renderExam(response: MaterialEngineResponse): string {
  const questions = response.exam?.questions ?? [];
  if (!questions.length) return "";

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

  return `<section><h2>Questões</h2>${body}</section>`;
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

function renderSlides(response: MaterialEngineResponse): string {
  const slides = response.slides ?? [];
  if (!slides.length) return "";

  const total = slides.length;

  const body = slides
    .map((slide, index) => {
      const number = index + 1;
      const isCover = index === 0;
      const bullets = (slide.bullets || []).filter((item) => item.trim());

      const bulletsHtml = bullets.length
        ? `<ul style="margin:0;padding-left:22px;list-style:disc;">${bullets
            .map(
              (item) =>
                `<li style="margin:6px 0;font-size:16px;line-height:1.5;color:#1e293b;">${escapeHtml(item)}</li>`,
            )
            .join("")}</ul>`
        : "";

      const notesHtml = slide.speakerNotes
        ? `<div style="margin-top:14px;padding:12px 14px;background:#f8fafc;border-left:3px solid #6366f1;border-radius:8px;">
             <span style="display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#6366f1;margin-bottom:4px;">Notas do professor</span>
             <span style="font-size:13px;line-height:1.55;color:#475569;">${escapeHtml(slide.speakerNotes)}</span>
           </div>`
        : "";

      return `
        <div class="planify-slide" style="margin:0 0 20px;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;background:#ffffff;box-shadow:0 1px 3px rgba(15,23,42,0.08);">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 18px;background:${isCover ? "#0f172a" : "#eef2ff"};color:${isCover ? "#ffffff" : "#3730a3"};">
            <span style="font-size:13px;font-weight:800;letter-spacing:0.04em;">${isCover ? "CAPA" : `SLIDE ${number}`}</span>
            <span style="font-size:12px;font-weight:700;opacity:0.85;">${number} / ${total}</span>
          </div>
          <div style="padding:18px 22px 22px;">
            <h3 style="margin:0 0 12px;font-size:${isCover ? "24px" : "20px"};font-weight:800;color:#0f172a;line-height:1.25;">${escapeHtml(slide.title)}</h3>
            ${bulletsHtml}
            ${notesHtml}
          </div>
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

  const branches = mindMap.branches
    .map(
      (branch) => `
        <li>
          <strong>${escapeHtml(branch.title)}</strong>
          ${asList(branch.items || [])}
        </li>
      `,
    )
    .join("");

  return `
    <section>
      <h2>Mapa mental: ${escapeHtml(mindMap.central)}</h2>
      <ul>${branches}</ul>
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

function renderAnswerKey(response: MaterialEngineResponse): string {
  if (!response.answerKey.length) return "";
  return `<section><h2>Gabarito</h2>${asList(response.answerKey, true)}</section>`;
}

function renderTeacherNotes(response: MaterialEngineResponse): string {
  if (!response.teacherNotes.length) return "";
  return `<section><h2>Notas para o professor</h2>${asList(response.teacherNotes)}</section>`;
}

function renderHtml(response: MaterialEngineResponse): string {
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
    renderExam(response),
    renderActivities(response),
    renderAnswerKey(response),
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
      ? response.slides.map((slide) => ({
          title: String(slide?.title || "Slide"),
          bullets: Array.isArray(slide?.bullets)
            ? slide.bullets.map((item) => String(item))
            : [],
          speakerNotes: String(slide?.speakerNotes || ""),
        }))
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
  const prompt = buildMaterialEnginePrompt(request);
  const maxOutputTokens = maxOutputTokensFor(request.tipoMaterial);

  let generated: Partial<MaterialEngineResponse> | null = null;
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      generated = await generateGeminiJSON<Partial<MaterialEngineResponse>>({
        systemInstruction,
        prompt,
        temperature: 0.32,
        topP: 0.86,
        maxOutputTokens,
        responseSchema: schema,
      });
      break;
    } catch (error) {
      lastError = error;
    }
  }

  if (!generated) {
    return {
      ok: false as const,
      status: 502,
      message:
        lastError instanceof Error
          ? lastError.message
          : "A IA não conseguiu gerar o material. Tente novamente.",
    };
  }

  const normalized = normalizeOutput(request, generated);
  const html = renderHtml(normalized);

  return {
    ok: true as const,
    status: 200,
    data: {
      tipoMaterial: request.tipoMaterial,
      html,
      estrutura: normalized,
    },
  };
}
