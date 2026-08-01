"use client";

import { useEffect, useState } from "react";
import { PlanifyModal } from "@/components/ui/PlanifyModal";

type BnccChallengeQuestion = {
  id: string;
  skillCode: string;
  subject: string | null;
  grade: string | null;
  prompt: string;
  options: string[];
  correctIndex: number;
};

type ComunidadeDocenteBnccChallengeModalProps = {
  open: boolean;
  onClose: () => void;
  onComplete: (reflection: string) => void | Promise<void>;
  subject?: string | null;
};

export function ComunidadeDocenteBnccChallengeModal({
  open,
  onClose,
  onComplete,
  subject,
}: ComunidadeDocenteBnccChallengeModalProps) {
  const [step, setStep] = useState(0);
  const [questions, setQuestions] = useState<BnccChallengeQuestion[]>([]);
  const [totalSkillsAvailable, setTotalSkillsAvailable] = useState(0);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [reflection, setReflection] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setStep(0);
    setQuestions([]);
    setTotalSkillsAvailable(0);
    setLoadingQuestions(false);
    setLoadError("");
    setAnswers({});
    setReflection("");
    setError("");
    setSubmitting(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }

    let cancelled = false;
    setLoadingQuestions(true);
    setLoadError("");

    const params = new URLSearchParams();
    if (subject) params.set("subject", subject);

    void fetch(`/api/community/docente/challenges/bncc?${params.toString()}`, {
      credentials: "include",
      cache: "no-store",
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.ok) {
          throw new Error(data?.error?.message || "Não foi possível carregar o desafio.");
        }
        if (cancelled) return;
        setQuestions(Array.isArray(data.questions) ? data.questions : []);
        setTotalSkillsAvailable(Number(data.totalSkillsAvailable || 0));
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : "Erro ao carregar desafio BNCC.");
      })
      .finally(() => {
        if (!cancelled) setLoadingQuestions(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, subject]);

  const allAnswered = questions.every((q) => answers[q.id] !== undefined);
  const allCorrect = questions.every((q) => answers[q.id] === q.correctIndex);

  async function handleFinish() {
    if (!allAnswered || !allCorrect) {
      setError("Responda corretamente todas as questões para concluir o desafio.");
      return;
    }
    if (reflection.trim().length < 20) {
      setError("Escreva uma breve reflexão (mínimo 20 caracteres) sobre como você alinha práticas à BNCC.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await onComplete(reflection.trim());
      handleClose();
    } catch {
      setError("Não foi possível registrar a conclusão do desafio.");
      setSubmitting(false);
    }
  }

  return (
    <PlanifyModal open={open} onClose={handleClose} title="Desafio BNCC na prática" maxWidth="max-w-lg">
      {step === 0 ? (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-slate-600">
            Este mini-desafio usa habilidades reais do catálogo BNCC do Planify. Você identificará
            descrições corretas de competências e refletirá sobre sua prática docente.
          </p>
          {loadingQuestions ? (
            <div className="flex items-center justify-center py-6">
              <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-cyan-200 border-t-cyan-500" />
            </div>
          ) : loadError ? (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
              {loadError}
            </p>
          ) : (
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
              <li>{questions.length} questões com habilidades BNCC reais</li>
              <li>Catálogo com {totalSkillsAvailable.toLocaleString("pt-BR")} habilidades ativas</li>
              <li>1 reflexão curta sobre sua prática</li>
              <li>Conclusão libera progresso do selo BNCC</li>
            </ul>
          )}
          <button
            type="button"
            disabled={loadingQuestions || Boolean(loadError) || questions.length === 0}
            onClick={() => setStep(1)}
            className="w-full rounded-2xl bg-cyan-500 py-3 text-sm font-bold text-white hover:bg-cyan-600 disabled:opacity-50"
          >
            Começar desafio
          </button>
        </div>
      ) : step === 1 ? (
        <div className="space-y-5">
          {questions.map((question, index) => (
            <fieldset key={question.id} className="space-y-2">
              <legend className="text-sm font-bold text-[#0F172A]">
                {index + 1}. {question.prompt}
              </legend>
              {question.options.map((option, optionIndex) => (
                <label
                  key={`${question.id}-${optionIndex}`}
                  className="flex cursor-pointer items-start gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm hover:border-cyan-200"
                >
                  <input
                    type="radio"
                    name={question.id}
                    checked={answers[question.id] === optionIndex}
                    onChange={() =>
                      setAnswers((current) => ({ ...current, [question.id]: optionIndex }))
                    }
                    className="mt-0.5"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </fieldset>
          ))}
          <button
            type="button"
            disabled={!allAnswered}
            onClick={() => {
              if (!allCorrect) {
                setError("Revise as respostas marcadas antes de continuar.");
                return;
              }
              setError("");
              setStep(2);
            }}
            className="w-full rounded-2xl bg-[#0F172A] py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            Continuar para reflexão
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <label className="block text-sm font-bold text-[#0F172A]">
            Como você alinha suas aulas e materiais à BNCC na prática?
          </label>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            rows={4}
            placeholder="Descreva uma prática concreta da sua sala de aula..."
            className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-400"
          />
          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleFinish()}
            className="w-full rounded-2xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {submitting ? "Concluindo…" : "Concluir desafio BNCC"}
          </button>
        </div>
      )}
      {error ? (
        <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
          {error}
        </p>
      ) : null}
    </PlanifyModal>
  );
}
