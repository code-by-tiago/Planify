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
} from "./material-engine-types";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function asList(items: string[]) {
  if (!items.length) return "";
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function renderHtml(response: MaterialEngineResponse): string {
  if (response.html && /<[a-z][\s\S]*>/i.test(response.html)) {
    return response.html;
  }

  const sections = response.sections
    .map(
      (section) => `
        <section>
          <h2>${escapeHtml(section.title)}</h2>
          <p>${escapeHtml(section.content)}</p>
          ${asList(section.bullets || [])}
        </section>
      `,
    )
    .join("");

  const activities = response.activities.length
    ? `
      <section>
        <h2>Atividades</h2>
        ${response.activities
          .map(
            (activity) => `
              <article>
                <h3>${escapeHtml(activity.title)}</h3>
                <p>${escapeHtml(activity.instructions)}</p>
                ${asList(activity.items || [])}
              </article>
            `,
          )
          .join("")}
      </section>
    `
    : "";

  const answerKey = response.answerKey.length
    ? `<section><h2>Gabarito</h2>${asList(response.answerKey)}</section>`
    : "";

  return `
    <article class="planify-doc">
      <h1>${escapeHtml(response.title)}</h1>
      <p>${escapeHtml(response.summary)}</p>
      ${sections}
      ${activities}
      ${answerKey}
    </article>
  `.trim();
}

function normalizeOutput(
  request: MaterialEngineRequest,
  response: Partial<MaterialEngineResponse>,
): MaterialEngineResponse {
  return {
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
    html: typeof response.html === "string" ? response.html : undefined,
  };
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

  const generated = await generateGeminiJSON<Partial<MaterialEngineResponse>>({
    systemInstruction,
    prompt,
    temperature: 0.32,
    topP: 0.86,
    maxOutputTokens: request.tipoMaterial === "slides" ? 12000 : 16000,
    responseSchema: schema,
  });

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
