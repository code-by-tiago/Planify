"use client";

import {
  fetchPublicLessonExecutionSession,
  joinLessonExecutionSession,
  submitLessonExecutionResponse,
  type LessonExecutionQuestion,
  type LessonExecutionSession,
  type LessonParticipant,
} from "@/lib/lesson-execution/lesson-execution-client";
import { useCallback, useEffect, useMemo, useState } from "react";

const POLL_INTERVAL_MS = 1800;
const DEVICE_TOKEN_KEY = "planify:lesson-device-token";
const STUDENT_NAME_KEY = "planify:lesson-student-name";

function normalizeCode(code: string): string {
  return String(code || "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 12);
}

function ensureDeviceToken(): string {
  const existing = window.localStorage.getItem(DEVICE_TOKEN_KEY);
  if (existing) return existing;

  const generated =
    typeof window.crypto?.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  window.localStorage.setItem(DEVICE_TOKEN_KEY, generated);
  return generated;
}

function participantStorageKey(code: string): string {
  return `planify:lesson-participant:${code}`;
}

function QuestionStatus({
  session,
  question,
}: {
  session: LessonExecutionSession;
  question: LessonExecutionQuestion;
}) {
  return (
    <div className="rounded-3xl border border-cyan-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-700">
            Pergunta aberta
          </p>
          <h1 className="mt-2 text-2xl font-black leading-tight text-slate-950">
            {question.prompt}
          </h1>
        </div>
        <span className="shrink-0 rounded-full bg-cyan-100 px-3 py-1 text-xs font-black text-cyan-900">
          {session.code}
        </span>
      </div>
    </div>
  );
}

function WaitingState({ session }: { session: LessonExecutionSession | null }) {
  const slide = session?.slides[session.activeSlideIndex] ?? session?.slides[0];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
        Aula ao vivo
      </p>
      <h1 className="mt-2 text-2xl font-black leading-tight text-slate-950">
        {session?.status === "ended"
          ? "Aula encerrada"
          : slide?.title || "Aguardando o professor"}
      </h1>
      <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
        {session?.status === "paused"
          ? "A aula está pausada. Aguarde o próximo comando."
          : session?.status === "ended"
            ? "Obrigado por participar."
            : "Quando o professor abrir uma pergunta, ela aparece aqui automaticamente."}
      </p>
    </div>
  );
}

export function JogarAulaClient({ initialCode }: { initialCode: string }) {
  const code = useMemo(() => normalizeCode(initialCode), [initialCode]);
  const [session, setSession] = useState<LessonExecutionSession | null>(null);
  const [participant, setParticipant] = useState<LessonParticipant | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [answer, setAnswer] = useState("");
  const [submittedQuestionId, setSubmittedQuestionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const activeQuestion = session?.activeQuestion ?? null;
  const canAnswer =
    Boolean(participant) &&
    session?.status === "live" &&
    Boolean(activeQuestion) &&
    submittedQuestionId !== activeQuestion?.id;

  const loadSession = useCallback(
    async (showLoading = false) => {
      if (!code) return;
      if (showLoading) setLoading(true);

      try {
        const fresh = await fetchPublicLessonExecutionSession(code);
        setSession(fresh);
        setError("");
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Não foi possível entrar nesta aula.",
        );
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [code],
  );

  useEffect(() => {
    setDisplayName(window.localStorage.getItem(STUDENT_NAME_KEY) || "");
    const savedParticipant = window.localStorage.getItem(participantStorageKey(code));
    if (savedParticipant) {
      try {
        setParticipant(JSON.parse(savedParticipant) as LessonParticipant);
      } catch {
        window.localStorage.removeItem(participantStorageKey(code));
      }
    }
    void loadSession(true);
  }, [code, loadSession]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void loadSession(false);
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [loadSession]);

  useEffect(() => {
    setAnswer("");
    if (activeQuestion?.id !== submittedQuestionId) return;
    if (session?.activeQuestionId !== submittedQuestionId) {
      setSubmittedQuestionId(null);
    }
  }, [activeQuestion?.id, session?.activeQuestionId, submittedQuestionId]);

  async function joinSession(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setJoining(true);
    setError("");

    try {
      const deviceToken = ensureDeviceToken();
      const joined = await joinLessonExecutionSession({
        code,
        displayName,
        deviceToken,
      });
      setParticipant(joined.participant);
      setSession(joined.session);
      window.localStorage.setItem(STUDENT_NAME_KEY, displayName.trim());
      window.localStorage.setItem(
        participantStorageKey(code),
        JSON.stringify(joined.participant),
      );
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Não foi possível entrar na sala.",
      );
    } finally {
      setJoining(false);
    }
  }

  async function sendAnswer(value: string) {
    if (!participant || !activeQuestion) return;
    const clean = value.trim();
    if (!clean) {
      setError("Digite uma resposta antes de enviar.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await submitLessonExecutionResponse({
        code,
        participantId: participant.id,
        questionId: activeQuestion.id,
        answer: clean,
      });
      setSubmittedQuestionId(activeQuestion.id);
      setAnswer("");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Não foi possível enviar a resposta.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-5 text-slate-950 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-40px)] w-full max-w-xl flex-col">
        <header className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-700">
              IAPlanify
            </p>
            <p className="mt-1 text-sm font-black text-slate-700">
              Sala {code || "..."}
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700 shadow-sm">
            {session?.status === "live" ? "Ao vivo" : "Aguardando"}
          </span>
        </header>

        {loading ? (
          <div className="rounded-3xl bg-white p-5 text-sm font-bold text-slate-600 shadow-sm">
            Carregando aula...
          </div>
        ) : null}

        {error ? (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">
            {error}
          </div>
        ) : null}

        {!participant ? (
          <form
            onSubmit={(event) => void joinSession(event)}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
              Identificação
            </p>
            <h1 className="mt-2 text-2xl font-black leading-tight text-slate-950">
              {session?.title || "Entrar na aula"}
            </h1>
            <label className="mt-5 block">
              <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                Seu nome
              </span>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                maxLength={40}
                placeholder="Ex: Ana"
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base font-bold text-slate-950 outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
              />
            </label>
            <button
              type="submit"
              disabled={joining || !code}
              className="mt-5 h-12 w-full rounded-2xl bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {joining ? "Entrando..." : "Entrar"}
            </button>
          </form>
        ) : activeQuestion && session?.status === "live" ? (
          <section className="space-y-4">
            <QuestionStatus session={session} question={activeQuestion} />

            {submittedQuestionId === activeQuestion.id ? (
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
                <p className="text-lg font-black text-emerald-900">
                  Resposta enviada.
                </p>
                <p className="mt-2 text-sm font-semibold text-emerald-800">
                  Aguarde o professor avançar ou abrir a próxima pergunta.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmittedQuestionId(null)}
                  className="mt-4 rounded-2xl border border-emerald-200 bg-white px-4 py-2 text-xs font-black text-emerald-900"
                >
                  Alterar resposta
                </button>
              </div>
            ) : activeQuestion.options.length ? (
              <div className="grid gap-3">
                {activeQuestion.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => void sendAnswer(option)}
                    disabled={!canAnswer || submitting}
                    className="min-h-14 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-base font-black text-slate-900 shadow-sm transition hover:border-cyan-300 hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                    Sua resposta
                  </span>
                  <textarea
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value)}
                    maxLength={240}
                    rows={5}
                    className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-semibold text-slate-950 outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => void sendAnswer(answer)}
                  disabled={!canAnswer || submitting || !answer.trim()}
                  className="mt-4 h-12 w-full rounded-2xl bg-cyan-500 px-5 text-sm font-black text-white transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Enviando..." : "Enviar resposta"}
                </button>
              </div>
            )}
          </section>
        ) : (
          <WaitingState session={session} />
        )}

        <footer className="mt-auto pt-6 text-center text-xs font-bold text-slate-500">
          {participant ? `Conectado como ${participant.displayName}` : "IAPlanify"}
        </footer>
      </div>
    </main>
  );
}
