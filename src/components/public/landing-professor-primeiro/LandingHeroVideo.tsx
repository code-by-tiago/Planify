"use client";

import { useEffect, useRef, useState } from "react";
import { LandingHeroLiveDashboard } from "./LandingHeroLiveDashboard";

const HERO_VIDEO_SRC = "/videos/planify-hero.mp4";
const HERO_POSTER_SRC = "/videos/planify-hero-poster.jpg";

export function LandingHeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onError = () => setUseFallback(true);
    video.addEventListener("error", onError);
    return () => video.removeEventListener("error", onError);
  }, []);

  if (useFallback) {
    return <LandingHeroLiveDashboard />;
  }

  return (
    <div className="relative mx-auto w-full max-w-xl lg:mx-0 lg:max-w-none">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 hidden h-40 w-40 rounded-full bg-cyan-400/15 blur-3xl sm:block"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-10 -left-8 hidden h-32 w-32 rounded-full bg-slate-900/5 blur-3xl sm:block"
      />

      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-950 shadow-2xl shadow-slate-900/15 ring-1 ring-slate-900/5">
        <div className="flex items-center gap-2 border-b border-white/10 bg-slate-900/90 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" aria-hidden />
          <span className="ml-2 text-[11px] font-semibold text-slate-400">
            Planejamentos · BNCC · Geração com IA
          </span>
        </div>

        <video
          ref={videoRef}
          className="aspect-[16/10] w-full bg-slate-900 object-cover object-top"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={HERO_POSTER_SRC}
          aria-label="Demonstração: página de planejamentos, sugestão de habilidades BNCC e geração com IA"
        >
          <source src={HERO_VIDEO_SRC} type="video/mp4" />
        </video>
      </div>
    </div>
  );
}
