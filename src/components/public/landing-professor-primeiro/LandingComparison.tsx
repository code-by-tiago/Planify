"use client";

import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { motion, useReducedMotion } from "framer-motion";
import { AFTER_ITEMS, BEFORE_ITEMS } from "./constants";
import { ppEyebrow } from "./theme";
import { useLandingMobileStatic } from "./useLandingMobileStatic";

export function LandingComparison() {
  const reduce = useReducedMotion();
  const mobileStatic = useLandingMobileStatic();
  const staticRender = reduce || mobileStatic;

  const content = (
    <div className="mt-12 grid gap-6 lg:grid-cols-2">
      <article className="overflow-hidden rounded-3xl border border-red-200/60 bg-white shadow-sm">
        <div className="flex h-44 items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300">
          <span className="text-6xl" aria-hidden>
            😩
          </span>
        </div>
        <div className="p-6 sm:p-8">
          <p className="text-xs font-extrabold uppercase tracking-wider text-red-600">Sem Planify</p>
          <h3 className="mt-2 text-xl font-extrabold text-slate-900">
            Horas perdidas com tarefas que não são o seu foco
          </h3>
          <ul className="mt-5 space-y-3" role="list">
            {BEFORE_ITEMS.map((item) => (
              <li key={item} className="flex gap-3 text-sm font-medium leading-6 text-slate-600">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-500">
                  <PlanifyIcon name="close" className="h-3.5 w-3.5" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </article>

      <article className="overflow-hidden rounded-3xl border border-cyan-200/80 bg-white shadow-md shadow-cyan-500/5">
        <div className="flex h-44 items-center justify-center bg-gradient-to-br from-cyan-100 to-blue-200">
          <span className="text-6xl" aria-hidden>
            😊
          </span>
        </div>
        <div className="p-6 sm:p-8">
          <p className="text-xs font-extrabold uppercase tracking-wider text-cyan-700">Com Planify</p>
          <h3 className="mt-2 text-xl font-extrabold text-slate-900">
            Mais tempo para ensinar. Menos tempo com burocracia
          </h3>
          <ul className="mt-5 space-y-3" role="list">
            {AFTER_ITEMS.map((item) => (
              <li key={item} className="flex gap-3 text-sm font-medium leading-6 text-slate-700">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-cyan-600">
                  <PlanifyIcon name="checkCircle" className="h-3.5 w-3.5" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </article>
    </div>
  );

  return (
    <section className="bg-white px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className={ppEyebrow}>Antes e depois</p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-extrabold text-slate-900 sm:text-4xl">
            A diferença na rotina do professor
          </h2>
        </div>

        {staticRender ? (
          content
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55 }}
          >
            {content}
          </motion.div>
        )}
      </div>
    </section>
  );
}
