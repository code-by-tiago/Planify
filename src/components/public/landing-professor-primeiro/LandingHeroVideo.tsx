"use client";

import { useEffect, useRef, useState } from "react";

const VIDEO_SRC = "/videos/planify-planejamento-hero.mp4";
const VIDEO_POSTER_SRC = "/videos/planify-planejamento-hero-poster.jpg";

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
              Planejamento com IA
            </span>
            <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full border border-cyan-300/25 bg-cyan-400/10 px-2 py-1 text-[9px] font-extrabold uppercase tracking-[0.09em] text-cyan-100 sm:px-2.5">
              <i className="h-1.5 w-1.5 rounded-full bg-teal-300 shadow-[0_0_0_3px_rgba(94,234,212,0.12)]" />
              Em ação
            </span>
          </div>

          {showPoster ? (
            <img
              src={VIDEO_POSTER_SRC}
              className="block aspect-[1.702/1] w-full bg-slate-100 object-contain object-top"
              alt="Tela do Planify mostrando o fluxo de planejamento com BNCC e inteligência artificial"
            />
          ) : (
            <video
              ref={videoRef}
              className="block aspect-[1.702/1] w-full bg-slate-100 object-contain object-top"
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
  );
}
