"use client";

import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { motion, useReducedMotion } from "framer-motion";
import { COMPARISON_ROWS } from "./constants";
import { ppEyebrow } from "./theme";

export function LandingComparison() {
  const reduce = useReducedMotion();

  return (
    <section className="bg-slate-50/80 px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className={ppEyebrow}>Antes e depois</p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Sem Planify vs Com Planify
          </h2>
          <p className="mt-4 text-base font-medium leading-7 text-slate-600">
            Veja como o fluxo muda quando você centraliza planejamento, criação e entrega em um só
            lugar.
          </p>
        </div>

        <div className="mt-12 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
          <div className="hidden grid-cols-[1fr_1fr_1fr] border-b border-slate-200 bg-slate-50/80 sm:grid">
            <div className="px-6 py-4 text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Tópico
            </div>
            <div className="border-l border-slate-200 px-6 py-4 text-xs font-extrabold uppercase tracking-wider text-red-600/80">
              Sem Planify
            </div>
            <div className="border-l border-slate-200 px-6 py-4 text-xs font-extrabold uppercase tracking-wider text-cyan-700">
              Com Planify
            </div>
          </div>

          {COMPARISON_ROWS.map((row, index) => (
            <motion.div
              key={row.topic}
              className="grid border-b border-slate-100 last:border-b-0 sm:grid-cols-[1fr_1fr_1fr]"
              initial={reduce ? false : { opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-4 sm:border-b-0 sm:bg-transparent sm:px-6">
                <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400 sm:hidden">
                  Tópico
                </p>
                <p className="text-sm font-extrabold text-slate-900 sm:mt-0">{row.topic}</p>
              </div>

              <div className="border-b border-slate-100 bg-red-50/30 px-5 py-4 sm:border-b-0 sm:border-l sm:border-slate-200 sm:px-6">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-red-600/70 sm:hidden">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-red-500">
                    <PlanifyIcon name="close" className="h-3 w-3" />
                  </span>
                  Sem Planify
                </p>
                <div className="flex gap-3">
                  <span className="mt-0.5 hidden h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-500 sm:flex">
                    <PlanifyIcon name="close" className="h-3.5 w-3.5" />
                  </span>
                  <p className="text-sm font-medium leading-6 text-slate-600">{row.without}</p>
                </div>
              </div>

              <div className="bg-cyan-50/40 px-5 py-4 sm:border-l sm:border-slate-200 sm:px-6">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-cyan-700 sm:hidden">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-100 text-cyan-600">
                    <PlanifyIcon name="checkCircle" className="h-3 w-3" />
                  </span>
                  Com Planify
                </p>
                <div className="flex gap-3">
                  <span className="mt-0.5 hidden h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-cyan-600 sm:flex">
                    <PlanifyIcon name="checkCircle" className="h-3.5 w-3.5" />
                  </span>
                  <p className="text-sm font-medium leading-6 text-slate-700">{row.with}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
