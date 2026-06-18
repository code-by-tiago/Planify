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
      <article className="overflow-hidden rounded-3xl border border-red-200/80 bg-gradient-to-br from-red-50/80 to-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-2xl">
            😩
          </span>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-red-600">Sem Planify</p>
            <h3 className="text-xl font-extrabold text-slate-900">Horas perdidas em burocracia</h3>
          </div>
        </div>
        <ul className="mt-6 space-y-3" role="list">
          {BEFORE_ITEMS.map((item) => (
            <li key={item} className="flex gap-3 text-sm font-medium leading-6 text-slate-600">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-500">
                <PlanifyIcon name="close" className="h-3.5 w-3.5" />
              </span>
              {item}
            </li>
          ))}
        </ul>
      </article>

      <article className="overflow-hidden rounded-3xl border border-cyan-200/80 bg-gradient-to-br from-cyan-50/80 to-white p-6 shadow-md shadow-cyan-500/5 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100 text-2xl">
            😊
          </span>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-cyan-700">Com Planify</p>
            <h3 className="text-xl font-extrabold text-slate-900">Mais tempo para ensinar</h3>
          </div>
        </div>
        <ul className="mt-6 space-y-3" role="list">
          {AFTER_ITEMS.map((item) => (
            <li key={item} className="flex gap-3 text-sm font-medium leading-6 text-slate-700">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-cyan-600">
                <PlanifyIcon name="checkCircle" className="h-3.5 w-3.5" />
              </span>
              {item}
            </li>
          ))}
        </ul>
      </article>
    </div>
  );

  return (
    <section className="bg-slate-50/80 px-5 py-16 sm:px-8 sm:py-20">
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
