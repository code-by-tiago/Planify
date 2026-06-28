"use client";

import { useEffect, useRef, useState } from "react";

const VIDEO_SRC = "/videos/planify-planejamento-hero.mp4";
const VIDEO_POSTER_SRC = "/videos/planify-planejamento-hero-poster.jpg";

/** Crop superior: oculta o banner "BNCC → IA → Google Docs" gravado no vídeo. */
const screenMediaClass =
  "absolute inset-x-0 top-0 h-[132%] w-full max-w-none -translate-y-[18%] object-cover object-top";

/** Laptop mockup com vídeo do fluxo de planejamento na tela. */
export function LandingHeroLaptopMockup() {
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
    <div className="relative mx-auto w-full max-w-xl lg:mx-0 lg:max-w-none">
      <div
        className="relative rounded-2xl bg-gradient-to-b from-slate-300 to-slate-400 p-3 shadow-[0_28px_60px_rgba(10,25,47,0.22),0_12px_24px_rgba(38,198,218,0.12)] sm:rounded-[1.25rem] sm:p-3.5"
        aria-hidden={false}
      >
        {/* Screen bezel */}
        <div className="overflow-hidden rounded-lg border border-slate-500/40 bg-[#0A192F] p-1.5 sm:rounded-xl sm:p-2">
          <div className="relative aspect-[16/10] overflow-hidden rounded-md bg-slate-900 sm:rounded-lg">
            {showPoster ? (
              <img
                src={VIDEO_POSTER_SRC}
                className={screenMediaClass}
                alt="Demonstração do Planify — planejamento BNCC com IA"
              />
            ) : (
              <video
                ref={videoRef}
                className={screenMediaClass}
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

        {/* Hinge + keyboard base */}
        <div className="mx-auto mt-2 h-1.5 w-[88%] rounded-full bg-slate-400/80" />
        <div className="mx-auto mt-1.5 h-3 w-full rounded-b-xl bg-gradient-to-b from-slate-300 to-slate-400 sm:h-4" />
      </div>
    </div>
  );
}
