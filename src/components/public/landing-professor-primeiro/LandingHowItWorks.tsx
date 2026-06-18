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
        </div>

        <div className="mt-14 hidden items-start lg:flex">
          {HOW_IT_WORKS.map((item, index) => (
            <div key={item.step} className="flex flex-1 items-start">
              <motion.article
                className="flex flex-1 flex-col items-center px-2 text-center"
                initial={reduce ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: index * 0.07 }}
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25">
                  <PlanifyIcon name={item.icon as PlanifyIconName} className="h-6 w-6" />
                </span>
                <span className="mt-3 flex h-7 w-7 items-center justify-center rounded-full bg-cyan-50 text-xs font-black text-cyan-800 ring-2 ring-cyan-100">
                  {item.step}
                </span>
                <h3 className="mt-3 text-sm font-extrabold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-xs font-medium leading-5 text-slate-500">
                  {item.description}
                </p>
              </motion.article>
              {index < HOW_IT_WORKS.length - 1 ? (
                <div className="flex shrink-0 items-center px-1 pt-7 text-cyan-300" aria-hidden>
                  <PlanifyIcon name="arrowRight" className="h-5 w-5" />
                </div>
              ) : null}
            </div>
          ))}
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
