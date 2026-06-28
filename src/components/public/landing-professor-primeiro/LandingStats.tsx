"use client";

import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type { PlanifyIconName } from "@/lib/pro/planifyTools";
import { motion, useReducedMotion } from "framer-motion";
import { STATS } from "./constants";
import { ppEyebrow } from "./theme";
import { useLandingMobileStatic } from "./useLandingMobileStatic";

const statCardClass =
  "group relative rounded-xl border border-slate-200/60 bg-[#F0F9FA] p-6 transition hover:border-[#26C6DA]/40 hover:shadow-sm";

export function LandingStats() {
  const reduce = useReducedMotion();
  const mobileStatic = useLandingMobileStatic();
  const staticRender = reduce || mobileStatic;

  return (
    <section className="bg-white px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <p className={`${ppEyebrow} text-center`}>Diferenciais</p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat, index) => {
            const content = (
              <>
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#26C6DA]/15 text-[#26C6DA]">
                  <PlanifyIcon
                    name={stat.icon as PlanifyIconName}
                    className="h-5 w-5"
                  />
                </span>
                <p className="mt-4 text-sm font-extrabold uppercase tracking-wide text-[#0A192F]">
                  {stat.value} {stat.label}
                </p>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                  {stat.detail}
                </p>
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
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: index * 0.07 }}
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
