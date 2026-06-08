"use client";

import { motion, useReducedMotion } from "framer-motion";
import { STATS } from "./constants";
import { ppEyebrow } from "./theme";
import { useLandingMobileStatic } from "./useLandingMobileStatic";

const statCardClass =
  "group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:border-cyan-200 hover:shadow-md";

export function LandingStats() {
  const reduce = useReducedMotion();
  const mobileStatic = useLandingMobileStatic();
  const staticRender = reduce || mobileStatic;

  return (
    <section className="border-y border-slate-200/80 bg-white px-5 py-14 sm:bg-gradient-to-b sm:from-cyan-50/40 sm:via-white sm:to-white sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <p className={`${ppEyebrow} text-center`}>Resultados reais</p>
        <h2 className="mt-3 text-center font-[family-name:var(--font-display)] text-2xl font-extrabold text-slate-900 sm:text-3xl">
          Feito para o dia a dia do professor
        </h2>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat, index) => {
            const content = (
              <>
                <div
                  className="pointer-events-none absolute -right-6 -top-6 hidden h-24 w-24 rounded-full bg-cyan-100/80 sm:block"
                  aria-hidden
                />
                <p className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-cyan-600 sm:text-4xl">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm font-extrabold uppercase tracking-wide text-slate-800">
                  {stat.label}
                </p>
                <p className="mt-3 text-xs font-medium leading-5 text-slate-500">{stat.detail}</p>
              </>
            );

            if (staticRender) {
              return (
                <article key={stat.label} className={statCardClass}>
                  {content}
                </article>
              );
            }

            return (
              <motion.article
                key={stat.label}
                className={statCardClass}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
              >
                {content}
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
