import { planifyAuthenticatedFetch } from "@/lib/auth/authenticated-fetch";

export type LessonExecutionQuestion = {
  id: string;
  type: "multiple_choice" | "quick_check" | "short_answer";
  slideIndex: number;
  title: string;
  prompt: string;
  options: string[];
};

export type LessonExecutionSlide = {
  title: string;
  bullets: string[];
  speakerNotes?: string;
  layout?: string;
  subtitle?: string;
  sequenceStep?: number;
  sequenceLabel?: string;
  callout?: { title?: string; text?: string };
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

export type LessonExecutionSession = {
  id: string;
  code: string;
  title: string;
  slides: LessonExecutionSlide[];
  questions: LessonExecutionQuestion[];
  activeSlideIndex: number;
  activeQuestionId: string | null;
  activeQuestion: LessonExecutionQuestion | null;
  status: "ready" | "live" | "paused" | "ended";
  expiresAt: string;
  results?: LessonExecutionResults;
};

export type LessonParticipant = {
  id: string;
  displayName: string;
};

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);

  if (!response.ok || data?.success === false) {
    throw new Error(
      data?.error?.message || data?.message || "Nao foi possivel concluir a acao.",
    );
  }

  return data.data as T;
}

export async function createLessonExecutionSession(params: {
  title: string;
  html: string;
  documentType?: string;
}): Promise<LessonExecutionSession> {
  const response = await planifyAuthenticatedFetch("/api/aula-executavel/sessoes", {
    method: "POST",
    body: JSON.stringify(params),
  });

  return parseJsonResponse<LessonExecutionSession>(response);
}

export async function fetchTeacherLessonExecutionSession(
  sessionId: string,
): Promise<LessonExecutionSession> {
  const response = await planifyAuthenticatedFetch(
    `/api/aula-executavel/sessoes/${encodeURIComponent(sessionId)}`,
    { method: "GET" },
  );

  return parseJsonResponse<LessonExecutionSession>(response);
}

export async function updateLessonExecutionSession(params: {
  sessionId: string;
  activeSlideIndex?: number;
  activeQuestionId?: string | null;
  status?: LessonExecutionSession["status"];
}): Promise<LessonExecutionSession> {
  const response = await planifyAuthenticatedFetch(
    `/api/aula-executavel/sessoes/${encodeURIComponent(params.sessionId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        activeSlideIndex: params.activeSlideIndex,
        activeQuestionId: params.activeQuestionId,
        status: params.status,
      }),
    },
  );

  return parseJsonResponse<LessonExecutionSession>(response);
}

export async function fetchPublicLessonExecutionSession(
  code: string,
): Promise<LessonExecutionSession> {
  const response = await fetch(
    `/api/aula-executavel/jogar/${encodeURIComponent(code)}`,
    { cache: "no-store" },
  );

  return parseJsonResponse<LessonExecutionSession>(response);
}

export async function joinLessonExecutionSession(params: {
  code: string;
  displayName: string;
  deviceToken: string;
}): Promise<{ participant: LessonParticipant; session: LessonExecutionSession }> {
  const response = await fetch(
    `/api/aula-executavel/jogar/${encodeURIComponent(params.code)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    },
  );

  return parseJsonResponse<{ participant: LessonParticipant; session: LessonExecutionSession }>(
    response,
  );
}

export async function submitLessonExecutionResponse(params: {
  code: string;
  participantId: string;
  questionId: string;
  answer: string;
}): Promise<void> {
  const response = await fetch(
    `/api/aula-executavel/jogar/${encodeURIComponent(params.code)}/responder`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    },
  );

  await parseJsonResponse<{ ok: true }>(response);
}
