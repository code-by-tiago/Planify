"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import {
  DEFAULT_MATERIAL_EDUCATION,
  EDUCATION_STAGES,
  getAreaOptions,
  getComponentOptions,
  getYearOptions,
  normalizeMaterialEducation,
  type MaterialEducationFields,
} from "@/lib/educacao/education-options";

const MAX_THEME_LENGTH = 100;

const SELECT_CLASS =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-left text-sm font-semibold text-[#0A192F] outline-none transition focus:border-[#26C6DA] focus:ring-4 focus:ring-[#26C6DA]/15 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70";

type ListaQuestion = {
  number: number;
  type: string;
  statement: string;
  options?: string[];
};

type ListaPreview = {
  title: string;
  componenteCurricular: string;
  anoSerie: string;
  etapa?: string;
  instructions: string;
  bnccHint: string;
  questions: ListaQuestion[];
};

function downloadPdfFromBase64(base64: string, filename: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function ListaPreviewCard({ lista }: { lista: ListaPreview }) {
  const previewQuestions = lista.questions.slice(0, 4);

  return (
    <div className="text-left" aria-live="polite">
      <p className="font-[family-name:var(--font-display)] text-lg font-extrabold text-[#0A192F] sm:text-xl">
        {lista.title}
      </p>
      <p className="mt-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {[lista.componenteCurricular, lista.anoSerie, lista.etapa]
          .filter(Boolean)
          .join(" · ")}
      </p>
      {lista.instructions ? (
        <p className="mt-3 text-sm font-medium leading-6 text-slate-600">{lista.instructions}</p>
      ) : null}

      <ol className="mt-5 space-y-4">
        {previewQuestions.map((question) => (
          <li key={question.number} className="border-t border-slate-100 pt-4 first:border-0 first:pt-0">
            <p className="text-sm font-bold text-[#0A192F]">
              <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#F0F9FA] text-xs text-[#26C6DA]">
                {String(question.number).padStart(2, "0")}
              </span>
              {question.statement}
            </p>
            {question.options?.length ? (
              <ul className="mt-2 space-y-1 pl-8 text-sm text-slate-600">
                {question.options.map((option, index) => (
                  <li key={index}>
                    {String.fromCharCode(97 + index)}) {option}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-2 space-y-1.5 pl-8" aria-hidden>
                <div className="h-px w-full bg-slate-200" />
                <div className="h-px w-5/6 bg-slate-200" />
              </div>
            )}
          </li>
        ))}
      </ol>

      {lista.questions.length > previewQuestions.length ? (
        <p className="mt-4 text-xs font-semibold text-slate-400">
          + {lista.questions.length - previewQuestions.length} exercícios no PDF completo (com
          gabarito)
        </p>
      ) : null}

      {lista.bnccHint ? (
        <p className="mt-4 rounded-xl bg-[#F0F9FA] px-3 py-2 text-xs font-medium leading-5 text-slate-600">
          <span className="font-bold text-[#0A192F]">BNCC sugerida: </span>
          {lista.bnccHint}
        </p>
      ) : null}
    </div>
  );
}

export function LandingHeroTrial() {
  const [education, setEducation] = useState<MaterialEducationFields>(DEFAULT_MATERIAL_EDUCATION);
  const [theme, setTheme] = useState("");
  const [loading, setLoading] = useState(false);
  const [lista, setLista] = useState<ListaPreview | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [pdfFilename, setPdfFilename] = useState("lista-de-atividades-planify.pdf");
  const [showResult, setShowResult] = useState(false);
  const [limited, setLimited] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const yearOptions = useMemo(() => getYearOptions(education.etapa), [education.etapa]);
  const areaOptions = useMemo(() => getAreaOptions(education.etapa), [education.etapa]);
  const componentOptions = useMemo(
    () => getComponentOptions(education.etapa, education.areaConhecimento),
    [education.etapa, education.areaConhecimento],
  );

  const applyEducation = (patch: Partial<MaterialEducationFields>) => {
    setEducation((current) => normalizeMaterialEducation(current, patch));
  };

  useEffect(() => {
    let cancelled = false;

    void fetch("/api/public/lesson-simulator")
      .then((response) => response.json())
      .then((json: { limited?: boolean }) => {
        if (!cancelled && json.limited) {
          setLimited(true);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const canGenerate =
    Boolean(theme.trim()) &&
    Boolean(education.etapa) &&
    Boolean(education.anoSerie) &&
    Boolean(education.areaConhecimento) &&
    Boolean(education.componente) &&
    !loading &&
    !limited;

  const handleGenerate = async () => {
    const trimmed = theme.trim();
    if (!canGenerate || !trimmed) return;

    setLoading(true);
    setError(null);
    setShowResult(false);
    setLista(null);
    setPdfBase64(null);

    try {
      const response = await fetch("/api/public/lesson-simulator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme: trimmed,
          etapa: education.etapa,
          anoSerie: education.anoSerie,
          areaConhecimento: education.areaConhecimento,
          componente: education.componente,
        }),
      });

      const json = (await response.json()) as {
        success?: boolean;
        data?: {
          lista?: ListaPreview;
          pdfBase64?: string;
          filename?: string;
        };
        error?: { code?: string; message?: string };
      };

      if (response.status === 429 || json.error?.code === "rate_limited") {
        setLimited(true);
        return;
      }

      if (!response.ok || !json.success || !json.data?.lista || !json.data.pdfBase64) {
        setError(
          json.error?.message || "Não foi possível gerar a lista de atividades. Tente novamente.",
        );
        return;
      }

      setLista(json.data.lista);
      setPdfBase64(json.data.pdfBase64);
      setPdfFilename(json.data.filename || "lista-de-atividades-planify.pdf");
      setShowResult(true);
      const isLocalDev =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
      if (!isLocalDev) {
        setLimited(true);
      }
    } catch {
      setError("Falha de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!pdfBase64) return;
    downloadPdfFromBase64(pdfBase64, pdfFilename);
  };

  return (
    <div className="mx-auto mt-10 w-full max-w-2xl">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void handleGenerate();
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-left">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Etapa de ensino
            </span>
            <select
              value={education.etapa}
              disabled={loading || limited}
              className={SELECT_CLASS}
              onChange={(event) => applyEducation({ etapa: event.target.value })}
            >
              {EDUCATION_STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
          </label>

          <label className="text-left">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Ano / série
            </span>
            <select
              value={education.anoSerie}
              disabled={loading || limited}
              className={SELECT_CLASS}
              onChange={(event) => applyEducation({ anoSerie: event.target.value })}
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>

          <label className="text-left sm:col-span-2">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Área do conhecimento
            </span>
            <select
              value={education.areaConhecimento}
              disabled={loading || limited}
              className={SELECT_CLASS}
              onChange={(event) => applyEducation({ areaConhecimento: event.target.value })}
            >
              {areaOptions.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </label>

          <label className="text-left sm:col-span-2">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Disciplina / componente
            </span>
            <select
              value={education.componente}
              disabled={loading || limited}
              className={SELECT_CLASS}
              onChange={(event) => applyEducation({ componente: event.target.value })}
            >
              {componentOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="relative mt-4">
          <label htmlFor="hero-trial-theme" className="sr-only">
            Tema da lista de atividades
          </label>
          <input
            ref={inputRef}
            id="hero-trial-theme"
            type="text"
            value={theme}
            maxLength={MAX_THEME_LENGTH}
            disabled={loading || limited}
            placeholder="Ex: Mitose, Frações, Revolução Francesa..."
            className="w-full rounded-full border border-slate-200 bg-white py-4 pl-6 pr-16 text-base font-medium text-[#0A192F] shadow-sm outline-none transition focus:border-[#26C6DA] focus:ring-4 focus:ring-[#26C6DA]/15 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70 sm:py-5 sm:pl-7 sm:pr-44 sm:text-lg"
            onChange={(event) => setTheme(event.target.value)}
          />
          <button
            type="submit"
            disabled={!canGenerate}
            aria-label="Gerar lista de atividades"
            className="absolute right-2 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center gap-2 rounded-full bg-[#0A192F] text-white transition hover:bg-[#132844] disabled:cursor-not-allowed disabled:opacity-40 sm:right-2.5 sm:h-12 sm:w-auto sm:px-6"
          >
            {loading ? (
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                aria-hidden
              />
            ) : (
              <>
                <span className="hidden text-sm font-bold sm:inline">Gerar</span>
                <PlanifyIcon name="arrowRight" className="h-4 w-4 sm:h-4 sm:w-4" />
              </>
            )}
          </button>
        </div>
      </form>

      <div className="mt-3 flex flex-col items-center justify-between gap-1.5 px-1 text-xs text-slate-400 sm:flex-row">
        <span>
          {theme.length}/{MAX_THEME_LENGTH} caracteres
        </span>
        <span className="inline-flex items-center gap-1.5">
          <PlanifyIcon name="shieldCheck" className="h-3.5 w-3.5 text-slate-300" />
          1 geração gratuita · sem cartão de crédito
        </span>
      </div>

      {error ? (
        <p className="mt-4 text-center text-sm font-medium text-rose-600">{error}</p>
      ) : null}

      {loading ? (
        <div
          className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-left sm:p-8"
          aria-live="polite"
          aria-busy="true"
        >
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-[#26C6DA]">
            Gerando lista de atividades…
          </p>
          <div className="space-y-3">
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-3/4 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      ) : null}

      {showResult && lista && !loading && !error ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-left sm:p-8">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-[#26C6DA]">
            Lista gerada pela IA
          </p>
          <ListaPreviewCard lista={lista} />

          <div className="mt-7 flex flex-col gap-2.5 border-t border-slate-100 pt-6">
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0A192F] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#132844]"
            >
              Baixar PDF para imprimir
              <PlanifyIcon name="download" className="h-4 w-4" />
            </button>
            <p className="text-center text-xs font-medium text-slate-400">
              O PDF inclui rodapé discreto do Planify. Remova-o assinando um plano.
            </p>
            <div className="flex flex-col gap-2.5 sm:flex-row">
              <Link
                href="/planos"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#26C6DA] px-6 py-3 text-sm font-bold text-[#0A192F] shadow-sm transition hover:brightness-105"
              >
                Remover rodapé · Ver planos
                <PlanifyIcon name="arrowRight" className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex flex-1 items-center justify-center rounded-full border border-slate-200 px-6 py-3 text-sm font-bold text-[#0A192F] transition hover:bg-slate-50"
              >
                Já tenho conta
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {limited && !showResult && !loading ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-center sm:p-8">
          <p className="text-sm font-bold text-[#0A192F]">
            Você já usou seu teste gratuito.
          </p>
          <p className="mt-1.5 text-sm text-slate-500">
            Crie sua conta para gerar listas e materiais completos, sem limite.
          </p>
          <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
            <Link
              href="/planos"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#26C6DA] px-6 py-3 text-sm font-bold text-[#0A192F] shadow-sm transition hover:brightness-105"
            >
              Ver planos
              <PlanifyIcon name="arrowRight" className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-6 py-3 text-sm font-bold text-[#0A192F] transition hover:bg-slate-50"
            >
              Entrar
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
