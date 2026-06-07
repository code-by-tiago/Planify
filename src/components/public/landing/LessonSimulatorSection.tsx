"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";

const MAX_THEME_LENGTH = 100;
const SIMULATOR_USED_COOKIE = "planify_sim_used";
const WINDOW_MS = 24 * 60 * 60 * 1000;

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function isSimulatorLimitedFromCookie(): boolean {
  const raw = readCookie(SIMULATOR_USED_COOKIE);
  if (!raw) return false;
  const usedAt = Number(raw);
  if (!Number.isFinite(usedAt) || usedAt <= 0) return false;
  return Date.now() - usedAt < WINDOW_MS;
}

function useTypewriter(text: string, active: boolean, speedMs = 10): string {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    if (!active || !text) {
      setDisplayed("");
      return;
    }

    setDisplayed("");
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setDisplayed(text.slice(0, index));
      if (index >= text.length) {
        window.clearInterval(timer);
      }
    }, speedMs);

    return () => window.clearInterval(timer);
  }, [text, active, speedMs]);

  return displayed;
}

export function LessonSimulatorSection() {
  const [theme, setTheme] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const typedResult = useTypewriter(result, showResult && !loading);

  useEffect(() => {
    setLimitReached(isSimulatorLimitedFromCookie());
  }, []);

  const openLimitModal = useCallback(() => {
    setShowLimitModal(true);
    setLimitReached(true);
  }, []);

  const handleGenerate = async () => {
    const trimmed = theme.trim();
    if (!trimmed || loading) return;

    if (limitReached || isSimulatorLimitedFromCookie()) {
      openLimitModal();
      return;
    }

    setLoading(true);
    setError(null);
    setShowResult(false);
    setResult("");

    try {
      const response = await fetch("/api/public/lesson-simulator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: trimmed }),
      });

      const json = (await response.json()) as {
        success?: boolean;
        data?: { skeleton?: string };
        error?: { code?: string; message?: string };
      };

      if (response.status === 429 || json.error?.code === "rate_limited") {
        openLimitModal();
        return;
      }

      if (!response.ok || !json.success || !json.data?.skeleton) {
        setError(json.error?.message || "Não foi possível gerar o esqueleto. Tente novamente.");
        return;
      }

      setResult(json.data.skeleton);
      setShowResult(true);
      setLimitReached(true);
    } catch {
      setError("Falha de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section
        id="simulador"
        className="pl-hud-landing-simulator-section relative isolate scroll-mt-28 overflow-hidden pb-0 pt-4"
      >
        <div className="pl-hud-landing-simulator-band mx-auto max-w-[calc(100%-2rem)] sm:max-w-7xl">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-14 sm:px-8 lg:grid-cols-2 lg:gap-12 lg:py-20">
            <div>
              <span className="pl-hud-badge inline-flex items-center gap-1.5">
                <PlanifyIcon name="spark" className="h-3 w-3" />
                Teste grátis
              </span>
              <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-[2.5rem] lg:text-5xl">
                Gere materiais baseados na BNCC,{" "}
                <span className="pl-hud-gradient-text">instantaneamente.</span>
              </h2>
              <p className="mt-5 max-w-lg text-lg font-medium leading-8 text-slate-600">
                Digite um tema e veja em segundos como o Planify estrutura uma aula alinhada à
                BNCC — sem criar conta. Uma geração gratuita por dia.
              </p>
              <Link
                href="/planos"
                className="pl-hud-btn mt-8 inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-semibold"
              >
                Ver planos
                <PlanifyIcon name="arrowRight" className="h-4 w-4" />
              </Link>
            </div>

            <div className="relative w-full min-w-0">
              <div className="pl-hud-landing-simulator-panel relative w-full min-w-0">
              <label htmlFor="lesson-simulator-theme" className="sr-only">
                Tema da aula
              </label>
              <input
                id="lesson-simulator-theme"
                type="text"
                value={theme}
                maxLength={MAX_THEME_LENGTH}
                disabled={loading || limitReached}
                placeholder="Digite um tema de aula... ex: Frações com Pizza para o 5º ano"
                className="pl-hud-landing-simulator-input w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-base text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-600/40 focus:ring-2 focus:ring-cyan-600/10 disabled:cursor-not-allowed disabled:opacity-60"
                onChange={(event) => setTheme(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleGenerate();
                  }
                }}
              />

              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="pl-hud-landing-simulator-meta text-xs font-medium">
                  {theme.length}/{MAX_THEME_LENGTH} caracteres
                </span>
                <button
                  type="button"
                  disabled={loading || !theme.trim() || limitReached}
                  onClick={() => {
                    if (limitReached) {
                      openLimitModal();
                      return;
                    }
                    void handleGenerate();
                  }}
                  className="pl-hud-btn inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {loading ? (
                    <>
                      <span className="pl-hud-landing-simulator-spinner" aria-hidden />
                      Gerando...
                    </>
                  ) : (
                    <>Gerar Esqueleto de Aula ✨</>
                  )}
                </button>
              </div>

              {error ? (
                <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </p>
              ) : null}

              <AnimatePresence>
                {(loading || showResult) && !error ? (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="pl-hud-landing-simulator-result mt-6 rounded-2xl border border-slate-200 bg-white p-5"
                  >
                    {loading ? (
                      <div className="space-y-3" aria-live="polite" aria-busy="true">
                        <div className="pl-hud-landing-simulator-shimmer h-4 w-3/4 rounded" />
                        <div className="pl-hud-landing-simulator-shimmer h-4 w-full rounded" />
                        <div className="pl-hud-landing-simulator-shimmer h-4 w-5/6 rounded" />
                        <div className="pl-hud-landing-simulator-shimmer h-4 w-2/3 rounded" />
                      </div>
                    ) : (
                      <div aria-live="polite">
                        <p className="pl-hud-landing-simulator-result-label mb-2 text-xs uppercase tracking-wide">
                          Esqueleto gerado
                        </p>
                        <pre className="pl-hud-landing-simulator-result-body whitespace-pre-wrap font-sans text-sm leading-7">
                          {typedResult}
                          {typedResult.length < result.length ? (
                            <span className="inline-block h-4 w-0.5 animate-pulse bg-slate-400 align-middle" />
                          ) : null}
                        </pre>
                      </div>
                    )}
                  </motion.div>
                ) : null}
              </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {showLimitModal ? (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="simulator-limit-title"
          >
            <button
              type="button"
              className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
              aria-label="Fechar"
              onClick={() => setShowLimitModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
            >
              <div className="relative">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl">
                  ✨
                </span>
                <h3
                  id="simulator-limit-title"
                  className="mt-4 text-xl font-extrabold tracking-tight text-slate-950"
                >
                  Limite do simulador atingido
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Você atingiu o limite do simulador gratuito! Crie sua conta para ter acesso
                  ilimitado ao painel completo.
                </p>
                <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                  <Link
                    href="/planos"
                    className="pl-hud-btn inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold"
                    onClick={() => setShowLimitModal(false)}
                  >
                    Ver planos
                    <PlanifyIcon name="arrowRight" className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/login"
                    className="pl-hud-btn-secondary inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold"
                    onClick={() => setShowLimitModal(false)}
                  >
                    Entrar
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
