"use client";

import { useEffect, useRef, useState } from "react";

const VIDEO_SRC = "/videos/planify-planejamento-hero.mp4";
const VIDEO_POSTER_SRC = "/videos/planify-planejamento-hero-poster.jpg";
const PLANNING_FLOW = ["Conteúdo", "BNCC", "Planejamento", "Editor", "Classroom"];

/** Vídeo do fluxo real de planejamento usado no hero público. */
export function LandingHeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showPoster, setShowPoster] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleError = () => setShowPoster(true);
    video.addEventListener("error", handleError);
    return () => video.removeEventListener("error", handleError);
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-2xl lg:mx-0 lg:max-w-none">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 hidden h-40 w-40 rounded-full bg-cyan-400/25 blur-3xl sm:block"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-10 -left-8 hidden h-36 w-36 rounded-full bg-blue-500/20 blur-3xl sm:block"
      />

      <div className="relative rounded-[1.55rem] bg-gradient-to-br from-cyan-300 via-cyan-500 to-violet-500 p-[3px] shadow-[0_26px_58px_rgba(15,23,42,0.2),0_10px_24px_rgba(8,145,178,0.17)]">
        <div className="overflow-hidden rounded-[calc(1.55rem-3px)] border border-slate-950/20 bg-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]">
          <div className="flex min-h-11 items-center gap-2 border-b border-slate-400/20 bg-gradient-to-r from-cyan-950 to-slate-900 px-3.5 py-2 text-slate-200 sm:px-4">
            <span className="flex gap-1.5" aria-hidden>
              <i className="h-2.5 w-2.5 rounded-full bg-rose-400 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]" />
              <i className="h-2.5 w-2.5 rounded-full bg-amber-300 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]" />
              <i className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]" />
            </span>
            <span className="min-w-0 truncate text-[11px] font-bold tracking-[0.015em] sm:text-xs">
              Planejamento BNCC
            </span>
            <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full border border-cyan-300/25 bg-cyan-400/10 px-2 py-1 text-[9px] font-extrabold uppercase tracking-[0.09em] text-cyan-100 sm:px-2.5">
              <i className="h-1.5 w-1.5 rounded-full bg-teal-300 shadow-[0_0_0_3px_rgba(94,234,212,0.12)]" />
              Fluxo guiado
            </span>
          </div>

          <div className="border-b border-slate-200 bg-white px-3 py-2.5 sm:px-4">
            <div
              aria-label="Fluxo do planejamento: conteúdo, BNCC, planejamento, editor e Classroom"
              className="flex items-center gap-1 overflow-x-auto whitespace-nowrap pb-0.5 text-[8px] font-extrabold uppercase tracking-[0.04em] text-slate-500 sm:gap-1.5 sm:text-[9px]"
            >
              {PLANNING_FLOW.map((step, index) => (
                <span key={step} className="inline-flex items-center gap-1 sm:gap-1.5">
                  <span className={index === 1 ? "text-cyan-700" : undefined}>{step}</span>
                  {index < PLANNING_FLOW.length - 1 ? (
                    <span aria-hidden className="text-slate-300">
                      →
                    </span>
                  ) : null}
                </span>
              ))}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[8px] font-bold sm:text-[9px]">
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-1 text-emerald-800">
                <i className="flex h-3 w-3 items-center justify-center rounded-full bg-emerald-500 text-[8px] not-italic text-white">
                  ✓
                </i>
                Conteúdos informados
              </span>
              <span className="rounded-md bg-cyan-50 px-1.5 py-1 text-cyan-800">
                Habilidades BNCC sugeridas
              </span>
              <span className="rounded-md border border-cyan-200 bg-white px-1.5 py-1 text-cyan-800">
                Aprovar habilidades
              </span>
              <span className="rounded-md bg-cyan-600 px-1.5 py-1 text-white shadow-sm">
                Gerar planejamento
              </span>
              <span className="rounded-md bg-slate-100 px-1.5 py-1 text-slate-700">
                Abrir no editor
              </span>
            </div>
          </div>

          <div className="relative aspect-[2.075/1] overflow-hidden bg-slate-100">
            {showPoster ? (
              <img
                src={VIDEO_POSTER_SRC}
                className="absolute -top-[22%] block h-auto w-full max-w-none"
                alt="Tela do Planify mostrando o fluxo de planejamento com BNCC e inteligência artificial"
              />
            ) : (
              <video
                ref={videoRef}
                className="absolute -top-[22%] block h-auto w-full max-w-none"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                poster={VIDEO_POSTER_SRC}
                aria-label="Vídeo demonstrando a criação de um planejamento no Planify"
              >
                <source src={VIDEO_SRC} type="video/mp4" />
              </video>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
