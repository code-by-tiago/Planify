import { randomBytes } from "crypto";
import { getSupabaseAdminClient } from "@/server/supabase/admin-client";
import { buildLessonPlanSlidesFromHtml } from "@/server/lesson-execution/lesson-plan-slides";
import type { MaterialEngineResponse } from "@/server/materials/material-engine-types";

type SlideItem = NonNullable<MaterialEngineResponse["slides"]>[number];

export type LessonExecutionQuestionType =
  | "multiple_choice"
  | "quick_check"
  | "short_answer";

export type LessonExecutionQuestion = {
  id: string;
  type: LessonExecutionQuestionType;
  slideIndex: number;
  title: string;
  prompt: string;
  options: string[];
};

export type LessonExecutionSessionStatus = "ready" | "live" | "paused" | "ended";

type SessionRow = {
  id: string;
  teacher_id: string;
  code: string;
  title: string;
  document_type: string;
  source_html: string;
  slides: SlideItem[];
  questions: LessonExecutionQuestion[];
  active_slide_index: number;
  active_question_id: string | null;
  status: LessonExecutionSessionStatus;
  created_at: string;
  updated_at: string;
  expires_at: string;
};

type ParticipantRow = {
  id: string;
  session_id: string;
  device_token: string;
  display_name: string;
  joined_at: string;
  last_seen_at: string;
};

type ResponseRow = {
  id: string;
  session_id: string;
  participant_id: string;
  question_id: string;
  answer: string;
  created_at: string;
  updated_at: string;
};

export type LessonExecutionResults = {
  participantCount: number;
  responsesByQuestion: Record<
    string,
    {
      total: number;
      options: Record<string, number>;
      latest: Array<{ answer: string; displayName: string; createdAt: string }>;
    }
  >;
};

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const MAX_PARTICIPANTS = 150;
const MAX_ANSWER_CHARS = 240;

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function safeTrim(value: unknown, max: number): string {
  const clean = normalizeText(value);
  return clean.length > max ? clean.slice(0, max).trim() : clean;
}

function generateCode(length = 6): string {
  const bytes = randomBytes(length);
  let code = "";

  for (const byte of bytes) {
    code += CODE_ALPHABET[byte % CODE_ALPHABET.length];
  }

  return code;
}

function questionSeedFromSlide(slide: SlideItem): string {
  const title = normalizeText(slide.title).replace(/[?.!]+$/g, "");
  return title || "tema da aula";
}

function buildQuestionsFromSlides(slides: SlideItem[]): LessonExecutionQuestion[] {
  const contentSlides = slides
    .map((slide, index) => ({ slide, index }))
    .filter(({ slide, index }) => index > 0 && slide.layout !== "fechamento");

  const seeds = contentSlides.length
    ? contentSlides.slice(0, 3)
    : slides.slice(0, 3).map((slide, index) => ({ slide, index }));

  const questions = seeds.map(({ slide, index }, order) => {
    const seed = questionSeedFromSlide(slide);

    if (order === 0) {
      return {
        id: `q-${order + 1}`,
        type: "quick_check" as const,
        slideIndex: index,
        title: "Checagem de compreensao",
        prompt: `Como esta sua compreensao sobre ${seed}?`,
        options: ["Entendi bem", "Entendi parcialmente", "Tenho duvida"],
      };
    }

    if (order === 1) {
      return {
        id: `q-${order + 1}`,
        type: "multiple_choice" as const,
        slideIndex: index,
        title: "Pergunta de aplicacao",
        prompt: `Qual acao ajuda mais a aprender ${seed}?`,
        options: [
          "Explicar com minhas palavras",
          "Ver mais um exemplo",
          "Resolver uma atividade",
          "Debater com a turma",
        ],
      };
    }

    return {
      id: `q-${order + 1}`,
      type: "short_answer" as const,
      slideIndex: index,
      title: "Resposta curta",
      prompt: `Escreva uma ideia importante sobre ${seed}.`,
      options: [],
    };
  });

  questions.push({
    id: "q-exit",
    type: "quick_check",
    slideIndex: Math.max(0, slides.length - 1),
    title: "Fechamento",
    prompt: "Ao final da aula, o que voce consegue fazer melhor?",
    options: ["Explicar o conteudo", "Aplicar em uma atividade", "Ainda preciso revisar"],
  });

  return questions;
}

function mapSession(row: Record<string, unknown>): SessionRow {
  return {
    id: String(row.id),
    teacher_id: String(row.teacher_id),
    code: String(row.code),
    title: String(row.title || "Aula Planify"),
    document_type: String(row.document_type || "material:plano-aula"),
    source_html: String(row.source_html || ""),
    slides: Array.isArray(row.slides) ? (row.slides as SlideItem[]) : [],
    questions: Array.isArray(row.questions)
      ? (row.questions as LessonExecutionQuestion[])
      : [],
    active_slide_index: Number(row.active_slide_index || 0),
    active_question_id:
      typeof row.active_question_id === "string" ? row.active_question_id : null,
    status: String(row.status || "ready") as LessonExecutionSessionStatus,
    created_at: String(row.created_at || ""),
    updated_at: String(row.updated_at || ""),
    expires_at: String(row.expires_at || ""),
  };
}

function publicSessionPayload(session: SessionRow) {
  const activeQuestion =
    session.questions.find((question) => question.id === session.active_question_id) ??
    null;

  return {
    id: session.id,
    code: session.code,
    title: session.title,
    slides: session.slides,
    questions: session.questions,
    activeSlideIndex: session.active_slide_index,
    activeQuestionId: session.active_question_id,
    activeQuestion,
    status: session.status,
    expiresAt: session.expires_at,
  };
}

async function createUniqueCode(): Promise<string> {
  const supabase = getSupabaseAdminClient();

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = generateCode();
    const { data, error } = await (supabase.from("lesson_execution_sessions" as never) as any)
      .select("id")
      .eq("code", code)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) return code;
  }

  throw new Error("Nao foi possivel gerar um codigo de sala unico.");
}

async function getSessionById(sessionId: string): Promise<SessionRow | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await (supabase.from("lesson_execution_sessions" as never) as any)
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapSession(data) : null;
}

async function getSessionByCode(code: string): Promise<SessionRow | null> {
  const supabase = getSupabaseAdminClient();
  const normalizedCode = normalizeText(code).toUpperCase();
  const { data, error } = await (supabase.from("lesson_execution_sessions" as never) as any)
    .select("*")
    .eq("code", normalizedCode)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapSession(data) : null;
}

function assertTeacher(session: SessionRow | null, teacherId: string): SessionRow {
  if (!session) {
    throw Object.assign(new Error("Sessao nao encontrada."), { status: 404 });
  }

  if (session.teacher_id !== teacherId) {
    throw Object.assign(new Error("Voce nao tem acesso a esta sessao."), {
      status: 403,
    });
  }

  return session;
}

export async function createLessonExecutionSession(input: {
  teacherId: string;
  title: string;
  html: string;
  documentType?: string;
}) {
  const supabase = getSupabaseAdminClient();
  const title = safeTrim(input.title, 140) || "Aula Planify";
  const html = String(input.html || "").trim();

  if (html.length < 20) {
    throw Object.assign(new Error("Gere o plano de aula antes de iniciar o Modo Aula."), {
      status: 400,
    });
  }

  const slides = buildLessonPlanSlidesFromHtml({ title, html });
  const questions = buildQuestionsFromSlides(slides);
  const code = await createUniqueCode();

  const { data, error } = await (supabase.from("lesson_execution_sessions" as never) as any)
    .insert({
      teacher_id: input.teacherId,
      code,
      title,
      document_type: input.documentType || "material:plano-aula",
      source_html: html.slice(0, 120_000),
      slides,
      questions,
      active_slide_index: 0,
      active_question_id: null,
      status: "ready",
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  return publicSessionPayload(mapSession(data));
}

export async function getTeacherLessonExecutionSession(input: {
  teacherId: string;
  sessionId: string;
}) {
  const session = assertTeacher(await getSessionById(input.sessionId), input.teacherId);
  const results = await getLessonExecutionResults(input.sessionId, input.teacherId);
  return { ...publicSessionPayload(session), results };
}

export async function updateTeacherLessonExecutionSession(input: {
  teacherId: string;
  sessionId: string;
  activeSlideIndex?: number;
  activeQuestionId?: string | null;
  status?: LessonExecutionSessionStatus;
}) {
  const session = assertTeacher(await getSessionById(input.sessionId), input.teacherId);
  const next: Record<string, unknown> = {};

  if (typeof input.activeSlideIndex === "number") {
    next.active_slide_index = Math.min(
      Math.max(0, Math.floor(input.activeSlideIndex)),
      Math.max(0, session.slides.length - 1),
    );
  }

  if (Object.prototype.hasOwnProperty.call(input, "activeQuestionId")) {
    const id = input.activeQuestionId;
    next.active_question_id =
      id && session.questions.some((question) => question.id === id) ? id : null;
  }

  if (input.status) {
    next.status = input.status;
  }

  if (!Object.keys(next).length) {
    const results = await getLessonExecutionResults(input.sessionId, input.teacherId);
    return { ...publicSessionPayload(session), results };
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await (supabase.from("lesson_execution_sessions" as never) as any)
    .update(next)
    .eq("id", input.sessionId)
    .eq("teacher_id", input.teacherId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  const updated = mapSession(data);
  const results = await getLessonExecutionResults(input.sessionId, input.teacherId);
  return { ...publicSessionPayload(updated), results };
}

export async function getLessonExecutionResults(
  sessionId: string,
  teacherId: string,
): Promise<LessonExecutionResults> {
  assertTeacher(await getSessionById(sessionId), teacherId);

  const supabase = getSupabaseAdminClient();
  const [{ data: participants, error: participantsError }, { data: responses, error: responsesError }] =
    await Promise.all([
      (supabase.from("lesson_execution_participants" as never) as any)
        .select("*")
        .eq("session_id", sessionId),
      (supabase.from("lesson_execution_responses" as never) as any)
        .select("*, lesson_execution_participants(display_name)")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false }),
    ]);

  if (participantsError) throw new Error(participantsError.message);
  if (responsesError) throw new Error(responsesError.message);

  const participantCount = Array.isArray(participants) ? participants.length : 0;
  const responsesByQuestion: LessonExecutionResults["responsesByQuestion"] = {};

  for (const raw of Array.isArray(responses) ? (responses as any[]) : []) {
    const row = raw as ResponseRow & {
      lesson_execution_participants?: { display_name?: string } | null;
    };
    const questionId = String(row.question_id || "");
    if (!questionId) continue;

    const bucket =
      responsesByQuestion[questionId] ??
      (responsesByQuestion[questionId] = { total: 0, options: {}, latest: [] });
    const answer = safeTrim(row.answer, MAX_ANSWER_CHARS);
    bucket.total += 1;
    bucket.options[answer] = (bucket.options[answer] || 0) + 1;
    if (bucket.latest.length < 12) {
      bucket.latest.push({
        answer,
        displayName:
          safeTrim(row.lesson_execution_participants?.display_name, 40) || "Aluno",
        createdAt: String(row.created_at || ""),
      });
    }
  }

  return { participantCount, responsesByQuestion };
}

export async function getPublicLessonExecutionSession(code: string) {
  const session = await getSessionByCode(code);
  if (!session) {
    throw Object.assign(new Error("Sala nao encontrada ou expirada."), {
      status: 404,
    });
  }

  return publicSessionPayload(session);
}

export async function joinLessonExecutionSession(input: {
  code: string;
  displayName?: string;
  deviceToken: string;
}) {
  const session = await getSessionByCode(input.code);
  if (!session) {
    throw Object.assign(new Error("Sala nao encontrada ou expirada."), {
      status: 404,
    });
  }

  if (session.status === "ended") {
    throw Object.assign(new Error("Esta aula ja foi encerrada."), { status: 410 });
  }

  const supabase = getSupabaseAdminClient();
  const { count, error: countError } = await (supabase.from(
    "lesson_execution_participants" as never,
  ) as any)
    .select("id", { count: "exact", head: true })
    .eq("session_id", session.id);

  if (countError) throw new Error(countError.message);
  if ((count || 0) >= MAX_PARTICIPANTS) {
    throw Object.assign(new Error("Sala cheia. Peça ao professor para criar outra sala."), {
      status: 429,
    });
  }

  const deviceToken = safeTrim(input.deviceToken, 80);
  if (deviceToken.length < 12) {
    throw Object.assign(new Error("Identificacao do dispositivo invalida."), {
      status: 400,
    });
  }

  const displayName = safeTrim(input.displayName, 40) || "Aluno";
  const { data, error } = await (supabase.from("lesson_execution_participants" as never) as any)
    .upsert(
      {
        session_id: session.id,
        device_token: deviceToken,
        display_name: displayName,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "session_id,device_token" },
    )
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  const participant = data as ParticipantRow;

  return {
    participant: {
      id: participant.id,
      displayName: participant.display_name,
    },
    session: publicSessionPayload(session),
  };
}

export async function submitLessonExecutionResponse(input: {
  code: string;
  participantId: string;
  questionId: string;
  answer: string;
}) {
  const session = await getSessionByCode(input.code);
  if (!session) {
    throw Object.assign(new Error("Sala nao encontrada ou expirada."), {
      status: 404,
    });
  }

  if (session.status !== "live") {
    throw Object.assign(new Error("A pergunta ainda nao esta aberta."), {
      status: 409,
    });
  }

  const question = session.questions.find(
    (item) => item.id === input.questionId && item.id === session.active_question_id,
  );

  if (!question) {
    throw Object.assign(new Error("Pergunta indisponivel no momento."), {
      status: 409,
    });
  }

  const answer = safeTrim(input.answer, MAX_ANSWER_CHARS);
  if (!answer) {
    throw Object.assign(new Error("Envie uma resposta antes de continuar."), {
      status: 400,
    });
  }

  if (question.options.length && !question.options.includes(answer)) {
    throw Object.assign(new Error("Resposta invalida para esta pergunta."), {
      status: 400,
    });
  }

  const supabase = getSupabaseAdminClient();
  const { data: participant, error: participantError } = await (supabase.from(
    "lesson_execution_participants" as never,
  ) as any)
    .select("*")
    .eq("id", input.participantId)
    .eq("session_id", session.id)
    .maybeSingle();

  if (participantError) throw new Error(participantError.message);
  if (!participant) {
    throw Object.assign(new Error("Entre novamente na sala para responder."), {
      status: 401,
    });
  }

  const now = new Date().toISOString();
  const { error } = await (supabase.from("lesson_execution_responses" as never) as any)
    .upsert(
      {
        session_id: session.id,
        participant_id: input.participantId,
        question_id: question.id,
        answer,
        updated_at: now,
      },
      { onConflict: "session_id,participant_id,question_id" },
    );

  if (error) throw new Error(error.message);

  await (supabase.from("lesson_execution_participants" as never) as any)
    .update({ last_seen_at: now })
    .eq("id", input.participantId);

  return { ok: true };
}
