import { appendPedagogicalGuardrails } from "@/lib/materiais/pedagogical-guardrails";
import type { CorrectionAiOutput, TeacherCorrectionProfile } from "@/types/correction";
import { generateGeminiJSON } from "../ai/gemini-client";

export type CorrectionAiPayload = {
  respostaAluno: string;
  enunciado?: string;
  gabarito?: string;
  rubrica?: string;
  componente?: string;
  anoSerie?: string;
  tema?: string;
  notaMaxima?: number;
  teacherProfile?: TeacherCorrectionProfile;
};

const SYSTEM_INSTRUCTION = appendPedagogicalGuardrails(`Você é um assistente pedagógico brasileiro especializado em correção formativa (estilo Teachy).
Avalie a resposta do estudante com base na rubrica e no gabarito quando fornecidos.
Devolutiva curta e acionável: feedbackGeral em no máximo 3 frases; comentários por critério em 1–2 frases.
Inclua nota numérica, percentual e sugestão breve para o professor usar em sala.
Seja justo, específico e útil — sem texto genérico ou repetitivo.
Responda SOMENTE em JSON válido, sem markdown.`);

function buildPrompt(payload: CorrectionAiPayload): string {
  const profile = payload.teacherProfile;
  const profileBlock = profile
    ? [
        "Preferências do professor (aprenda o estilo):",
        `- Tom: ${profile.tom}`,
        `- Rigor: ${profile.rigor}`,
        profile.foco.length ? `- Foco: ${profile.foco.join(", ")}` : "",
        profile.exemplosFeedback.length
          ? `- Exemplos de devolutivas anteriores:\n${profile.exemplosFeedback.map((e) => `  • ${e}`).join("\n")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  return [
    "Corrija a resposta do estudante e produza devolutiva pedagógica.",
    payload.tema ? `Tema: ${payload.tema}` : "",
    payload.componente ? `Componente: ${payload.componente}` : "",
    payload.anoSerie ? `Ano/série: ${payload.anoSerie}` : "",
    payload.enunciado ? `Enunciado/questão:\n${payload.enunciado}` : "",
    payload.gabarito ? `Gabarito/resposta esperada:\n${payload.gabarito}` : "",
    payload.rubrica
      ? `Rubrica/critérios:\n${payload.rubrica}`
      : "Rubrica: avalie domínio do conteúdo (40%), adequação ao comando (30%), organização/clareza (20%) e uso de vocabulário do tema (10%).",
    `Nota máxima sugerida: ${payload.notaMaxima ?? 10}`,
    profileBlock,
    "Resposta do estudante:",
    payload.respostaAluno.trim(),
    "",
    "Formato Teachy: feedbackGeral curto (máx. 3 frases); criterios com comentario objetivo; pontosFortes e pontosMelhoria com 2–4 itens cada; sugestaoProfessor em 1 frase aplicável em sala.",
    "Retorne JSON com: nota (number), notaMaxima (number), percentual (number 0-100), feedbackGeral (string), criterios (array de {criterio, atendido, pontos, pontosMaximos, comentario}), pontosFortes (string[]), pontosMelhoria (string[]), sugestaoProfessor (string curta para o professor usar em sala).",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function validatePayload(payload: CorrectionAiPayload): string | null {
  const resposta = String(payload.respostaAluno || "").trim();
  if (!resposta || resposta.length < 15) {
    return "Cole a resposta do estudante com pelo menos 15 caracteres.";
  }
  return null;
}

export async function evaluateCorrectionWithAI(
  payload: CorrectionAiPayload,
): Promise<
  | { ok: false; status: number; message: string }
  | { ok: true; result: CorrectionAiOutput; usedAI: true }
> {
  const validationError = validatePayload(payload);
  if (validationError) {
    return { ok: false, status: 400, message: validationError };
  }

  const tier = "advanced" as const;

  try {
    const generated = await generateGeminiJSON<CorrectionAiOutput>({
      systemInstruction: SYSTEM_INSTRUCTION,
      prompt: buildPrompt(payload),
      tier,
      temperature: 0.35,
      maxOutputTokens: 4096,
    });

    const notaMaxima = Number(generated.notaMaxima || payload.notaMaxima || 10);
    const nota = Math.min(notaMaxima, Math.max(0, Number(generated.nota || 0)));
    const percentual = Number(
      generated.percentual ?? Math.round((nota / Math.max(1, notaMaxima)) * 100),
    );

    return {
      ok: true,
      usedAI: true,
      result: {
        ...generated,
        nota,
        notaMaxima,
        percentual,
        feedbackGeral: String(generated.feedbackGeral || "").trim(),
        criterios: Array.isArray(generated.criterios) ? generated.criterios : [],
        pontosFortes: Array.isArray(generated.pontosFortes)
          ? generated.pontosFortes.map(String)
          : [],
        pontosMelhoria: Array.isArray(generated.pontosMelhoria)
          ? generated.pontosMelhoria.map(String)
          : [],
        sugestaoProfessor: String(generated.sugestaoProfessor || "").trim(),
      },
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "A IA não conseguiu corrigir a resposta. Tente novamente.";

    return { ok: false, status: 502, message };
  }
}
