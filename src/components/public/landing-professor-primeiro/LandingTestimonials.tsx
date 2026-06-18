"use client";

import { motion, useReducedMotion } from "framer-motion";
import { TESTIMONIALS } from "./constants";
import { ppEyebrow } from "./theme";
import { useLandingMobileStatic } from "./useLandingMobileStatic";

export function LandingTestimonials() {
  const reduce = useReducedMotion();
  const mobileStatic = useLandingMobileStatic();
  const staticRender = reduce || mobileStatic;

  return (
    <section className="border-y border-slate-200/80 bg-slate-50/80 px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className={ppEyebrow}>Depoimentos</p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-extrabold text-slate-900 sm:text-4xl">
            O que professores estão dizendo
          </h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((item, index) => {
            const card = (
              <article className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <p className="text-amber-400" aria-hidden>
                  ★★★★★
                </p>
                <blockquote className="mt-4 flex-1 text-sm font-medium leading-7 text-slate-600">
                  &ldquo;{item.quote}&rdquo;
                </blockquote>
                <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-bold text-white">
                    {item.initials}
                  </span>
                  <div>
                    <p className="text-sm font-extrabold text-slate-900">{item.name}</p>
                    <p className="text-xs font-medium text-slate-500">{item.role}</p>
                  </div>
                </div>
              </article>
            );

            if (staticRender) {
              return <div key={item.name}>{card}</div>;
            }

            return (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
              >
                {card}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
