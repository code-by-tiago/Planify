"use client";

import { motion, useReducedMotion } from "framer-motion";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type { PlanifyIconName } from "@/lib/pro/planifyTools";
import { HOW_IT_WORKS } from "./constants";
import { ppEyebrow } from "./theme";

export function LandingHowItWorks() {
  const reduce = useReducedMotion() ?? false;

  return (
    <section id="como-funciona" className="scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className={ppEyebrow}>Como funciona</p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Do conteúdo ao planejamento em minutos
          </h2>
          <p className="mt-4 text-base font-medium leading-7 text-slate-600">
            Cinco passos simples — da ideia à turma, sem sair do Planify.
          </p>
        </div>

        <div className="mt-14 hidden lg:block">
          <div className="relative flex items-start justify-between gap-2">
            <div
              aria-hidden
              className="absolute left-[10%] right-[10%] top-7 h-0.5 bg-gradient-to-r from-cyan-200 via-cyan-400 to-cyan-200"
            />
            {HOW_IT_WORKS.map((item, index) => (
              <motion.article
                key={item.step}
                className="relative z-[1] flex max-w-[11rem] flex-1 flex-col items-center text-center"
                initial={reduce ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25">
                  <PlanifyIcon name={item.icon as PlanifyIconName} className="h-6 w-6" />
                </span>
                <span className="mt-3 flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-black text-cyan-700 ring-2 ring-cyan-200">
                  {item.step}
                </span>
                <h3 className="mt-3 text-sm font-extrabold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-xs font-medium leading-5 text-slate-500">
                  {item.description}
                </p>
              </motion.article>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:hidden">
          {HOW_IT_WORKS.map((item) => (
            <article
              key={item.step}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md">
                  <PlanifyIcon name={item.icon as PlanifyIconName} className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-600">
                    Passo {item.step}
                  </p>
                  <h3 className="mt-1 text-base font-extrabold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                    {item.description}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
