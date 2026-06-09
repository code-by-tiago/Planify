"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type { PlanifyIconName } from "@/lib/pro/planifyTools";
import { TeachyLessonPreview } from "@/components/public/landing/TeachyLessonPreview";

type PreviewVariant = "spark" | "layers" | "externalLink" | "pen";

function PreviewShell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <div className={`relative isolate mx-auto w-full max-w-md ${className}`}>
      <div
        className="pl-hud-feature-glow pointer-events-none absolute -inset-6 hidden rounded-[2.5rem] sm:block"
        aria-hidden
      />
      <motion.div
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.65, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="pl-float relative"
      >
        {children}
      </motion.div>
    </div>
  );
}

function MaterialFeaturePreview() {
  const chips = ["Plano de aula", "Lista", "Quiz", "Resumo"];

  return (
    <PreviewShell>
      <div className="pl-hud-glass overflow-hidden rounded-2xl p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-600">
              Gerador IA · BNCC
            </p>
            <p className="mt-1 text-lg font-extrabold leading-tight text-slate-950">
              Revolução Industrial
            </p>
          </div>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 text-white shadow-sm">
            <PlanifyIcon name="spark" className="h-5 w-5" />
          </span>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-950 p-4 text-white shadow-inner">
          <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-200/80">
            Apresentação em slides
          </p>
          <p className="mt-2 text-sm font-black">Slide 3 · Inovações tecnológicas</p>
          <div className="mt-3 flex h-14 items-center justify-center rounded-lg border border-white/10 bg-white/5">
            <PlanifyIcon name="presentation" className="h-7 w-7 text-cyan-300/90" />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-cyan-400/20 bg-white/80 px-2.5 py-1 text-[10px] font-bold text-cyan-700"
            >
              {chip}
            </span>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-cyan-400/15 bg-white/60 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" />
              <span className="relative h-2.5 w-2.5 rounded-full bg-cyan-500" />
            </span>
            <span className="text-[11px] font-bold text-slate-600">Gerando material…</span>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-bold text-white">
            <PlanifyIcon name="download" className="h-3 w-3" />
            Google Docs
          </span>
        </div>
      </div>

      <div className="pl-float absolute -right-2 -top-3 z-10 hidden rounded-xl border border-cyan-400/25 bg-white/90 px-3 py-2 shadow-lg backdrop-blur-sm sm:flex sm:items-center sm:gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          <PlanifyIcon name="checkCircle" className="h-4 w-4" />
        </span>
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Alinhado à</p>
          <p className="text-xs font-black text-slate-900">BNCC</p>
        </div>
      </div>
    </PreviewShell>
  );
}

function ClassroomFeaturePreview() {
  const courses = [
    { name: "9º Ano A · História", active: true },
    { name: "8º Ano B · Geografia", active: false },
  ];

  return (
    <PreviewShell className="max-w-lg">
      <div className="pl-hud-glass overflow-hidden rounded-2xl p-4 sm:p-5">
        <div className="flex items-center gap-2 border-b border-cyan-400/15 pb-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-sm">
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-600">
              Google Classroom
            </p>
            <p className="text-sm font-extrabold text-slate-950">Publicar na turma</p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {courses.map((course) => (
            <div
              key={course.name}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition ${
                course.active
                  ? "border-cyan-400/40 bg-cyan-50/60 shadow-sm"
                  : "border-cyan-400/10 bg-white/50"
              }`}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                  course.active ? "border-cyan-500 bg-cyan-500" : "border-slate-300"
                }`}
              >
                {course.active ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                ) : null}
              </span>
              <span className="text-xs font-bold text-slate-800">{course.name}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-50/70 p-3">
          <div className="flex items-start gap-2.5">
            <PlanifyIcon name="checkCircle" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <div>
              <p className="text-xs font-extrabold text-emerald-800">Material publicado</p>
              <p className="mt-0.5 text-[11px] font-medium leading-snug text-emerald-700/90">
                Google Docs no Drive · atividade criada na turma
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-lg border border-cyan-400/15 bg-white/70 px-3 py-2">
          <PlanifyIcon name="fileText" className="h-4 w-4 text-cyan-600" />
          <span className="truncate text-[11px] font-semibold text-slate-600">
            revolucao-industrial-lista
          </span>
        </div>
      </div>
    </PreviewShell>
  );
}

function RedacaoFeaturePreview() {
  const criterios = ["Competência I", "Competência II", "Competência V"];

  return (
    <PreviewShell>
      <div className="pl-hud-glass overflow-hidden rounded-2xl p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-600">
              Proposta de redação · ENEM
            </p>
            <p className="mt-1 text-base font-extrabold leading-snug text-slate-950">
              Mobilidade urbana nas grandes cidades
            </p>
          </div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
            <PlanifyIcon name="pen" className="h-4 w-4" />
          </span>
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Textos motivadores
          </p>
          {[1, 2].map((n) => (
            <div
              key={n}
              className="rounded-lg border border-cyan-400/12 bg-white/70 px-3 py-2"
            >
              <div className="space-y-1.5">
                <div className="h-2 w-full rounded-full bg-slate-100" />
                <div className="h-2 w-11/12 rounded-full bg-slate-50" />
                <div className="h-2 w-4/5 rounded-full bg-slate-50" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-cyan-400/20 bg-gradient-to-br from-slate-900 to-slate-800 p-3 text-white">
          <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-200/70">Comando</p>
          <p className="mt-1.5 text-xs font-semibold leading-relaxed text-slate-100">
            Redija um texto dissertativo-argumentativo sobre os desafios da mobilidade urbana…
          </p>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {criterios.map((c) => (
            <span
              key={c}
              className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-700"
            >
              {c}
            </span>
          ))}
        </div>
      </div>
    </PreviewShell>
  );
}

export function InclusionFeaturePreview() {
  return (
    <PreviewShell className="max-w-lg">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" aria-hidden />
          <span className="ml-1 text-[11px] font-bold tracking-wide text-slate-500">
            Planify IA — Inclusão
          </span>
        </div>

        <div className="p-4 sm:p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
            Modo de adaptação
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-full border border-cyan-600/25 bg-cyan-50 px-2.5 py-1 text-[10px] font-bold text-cyan-800">
              Adaptação de Atividades
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-600">
              Trilhas Paralelas
            </span>
          </div>

          <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
            Necessidade do aluno
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {["TEA", "TDAH", "Dislexia"].map((chip, i) => (
              <span
                key={chip}
                className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                  i === 0
                    ? "border-cyan-600/25 bg-cyan-50 text-cyan-800"
                    : "border-slate-200 bg-slate-50 text-slate-600"
                }`}
              >
                {chip}
              </span>
            ))}
          </div>

          <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
            Conteúdo original
          </p>
          <div
            className="mt-2 space-y-1.5 rounded-xl border border-slate-200 bg-slate-50 p-3"
            aria-hidden
          >
            <div className="h-2 w-[42%] rounded-full bg-slate-200" />
            <div className="h-2 w-full rounded-full bg-slate-100" />
            <div className="h-2 w-[72%] rounded-full bg-slate-100" />
          </div>

          <div className="mt-5 flex justify-end">
            <span className="pl-hud-btn pointer-events-none inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold">
              ✨ Adaptar Material para Inclusão
            </span>
          </div>
        </div>
      </div>
    </PreviewShell>
  );
}

const previewMap: Record<PreviewVariant, () => ReactNode> = {
  spark: MaterialFeaturePreview,
  layers: () => (
    <div className="relative isolate mx-auto w-full max-w-lg">
      <div
        className="pl-hud-feature-glow pointer-events-none absolute -inset-6 hidden rounded-[2.5rem] sm:block"
        aria-hidden
      />
      <div className="pl-float relative">
        <TeachyLessonPreview showCta={false} />
      </div>
    </div>
  ),
  externalLink: ClassroomFeaturePreview,
  pen: RedacaoFeaturePreview,
};

export function TeachyFeaturePreview({ icon }: { icon: PlanifyIconName }) {
  const Preview = previewMap[icon as PreviewVariant];
  if (!Preview) return null;
  return <>{Preview()}</>;
}
