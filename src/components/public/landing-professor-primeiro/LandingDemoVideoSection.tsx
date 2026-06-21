"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type { PlanifyIconName } from "@/lib/pro/planifyTools";
import { LandingHeroLiveDashboard } from "./LandingHeroLiveDashboard";
import { ppBtnSecondary, ppEyebrow } from "./theme";

const DEMO_VIDEO_SRC = "/videos/planify-demo-loop.mp4";

const JOURNEY_STEPS = [
  {
    id: "planeje",
    label: "Planeje",
    description: "Matriz anual e trimestral com BNCC e modelos oficiais.",
    icon: "clipboard" as PlanifyIconName,
  },
  {
    id: "crie",
    label: "Crie",
    description: "Atividades, provas, slides e jogos pedagógicos com IA.",
    icon: "spark" as PlanifyIconName,
  },
  {
    id: "revise",
    label: "Revise",
    description: "Editor integrado, correção inteligente e adaptação inclusiva.",
    icon: "editor" as PlanifyIconName,
  },
  {
    id: "compartilhe",
    label: "Compartilhe",
    description: "Google Classroom, biblioteca escolar e comunidade docente.",
    icon: "externalLink" as PlanifyIconName,
  },
] as const;

export function LandingDemoVideoSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onError = () => setUseFallback(true);
    video.addEventListener("error", onError);
    return () => video.removeEventListener("error", onError);
  }, []);

  return (
    <section
      id="demo"
      className="pf-demo-video-section scroll-mt-24 border-b border-slate-200/80 bg-gradient-to-b from-white to-slate-50/60"
      aria-labelledby="demo-video-heading"
    >
      <div className="pf-demo-video-section-inner">
        <div className="pf-demo-video-column">
          {useFallback ? (
            <LandingHeroLiveDashboard />
          ) : (
            <div className="pf-demo-video-wrap">
              <div className="pf-demo-video-glow" aria-hidden />
              <div className="pf-demo-video-shell">
                <div className="pf-demo-video-frame">
                  <div className="pf-demo-video-chrome">
                    <span className="pf-demo-video-dot pf-demo-video-dot--red" aria-hidden />
                    <span className="pf-demo-video-dot pf-demo-video-dot--amber" aria-hidden />
                    <span className="pf-demo-video-dot pf-demo-video-dot--green" aria-hidden />
                    <span className="pf-demo-video-chrome-label">Planify · demonstração ao vivo</span>
                  </div>

                  <video
                    ref={videoRef}
                    className="pf-demo-video-player"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    aria-label="Demonstração em vídeo do fluxo Planify: planeje, crie, revise e compartilhe"
                  >
                    <source src={DEMO_VIDEO_SRC} type="video/mp4" />
                  </video>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="pf-demo-video-copy">
          <p className={ppEyebrow}>Veja na prática</p>
          <h2
            id="demo-video-heading"
            className="mt-3 font-[family-name:var(--font-display)] text-3xl font-extrabold text-slate-900 sm:text-4xl"
          >
            Planeje → Crie → Revise → Compartilhe
          </h2>
          <p className="mt-4 text-base font-medium leading-7 text-slate-600">
            Um fluxo contínuo na mesma plataforma — do planejamento BNCC à publicação na turma,
            sem retrabalho entre ferramentas.
          </p>

          <ul className="mt-8 space-y-4" role="list">
            {JOURNEY_STEPS.map((step, index) => (
              <li key={step.id} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20">
                  <PlanifyIcon name={step.icon} className="h-4 w-4" />
                </span>
                <span className="pt-0.5">
                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-600">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="mt-0.5 block text-base font-extrabold text-slate-900">
                    {step.label}
                  </span>
                  <span className="mt-0.5 block text-sm font-medium leading-6 text-slate-600">
                    {step.description}
                  </span>
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/cadastro" className={`${ppBtnSecondary} px-6 py-3`}>
              Começar grátis
            </Link>
            <Link href="/#jornada" className="inline-flex items-center gap-1.5 px-2 py-3 text-sm font-bold text-cyan-700 transition hover:text-cyan-900">
              Explorar a jornada
              <PlanifyIcon name="arrowRight" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
