"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type { PlanifyIconName } from "@/lib/pro/planifyTools";
import { SOCIAL_PROOF_STATS } from "./constants";
import { ppEyebrow } from "./theme";

function formatStatValue(value: number, prefix = "", suffix = ""): string {
  const formatted = new Intl.NumberFormat("pt-BR").format(value);
  return `${prefix}${formatted}${suffix}`;
}

function AnimatedStat({
  target,
  prefix = "",
  suffix = "",
  label,
  icon,
  index,
  staticRender,
}: {
  target: number;
  prefix?: string;
  suffix?: string;
  label: string;
  icon: PlanifyIconName;
  index: number;
  staticRender: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [display, setDisplay] = useState(staticRender ? target : 0);

  useEffect(() => {
    if (!inView || staticRender) {
      setDisplay(target);
      return;
    }

    const duration = 1800;
    const start = performance.now();

    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(Math.round(target * eased));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, staticRender, target]);

  const card = (
    <article
      ref={ref}
      className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:border-cyan-200 hover:shadow-md"
    >
      <div
        className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-cyan-100/60 opacity-0 transition group-hover:opacity-100"
        aria-hidden
      />
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 ring-1 ring-cyan-100">
        <PlanifyIcon name={icon} className="h-5 w-5" />
      </span>
      <p className="mt-4 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
        {formatStatValue(display, prefix, suffix)}
      </p>
      <p className="mt-1 text-sm font-bold text-slate-600">{label}</p>
    </article>
  );

  if (staticRender) {
    return card;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
    >
      {card}
    </motion.div>
  );
}

export function LandingSocialProof() {
  const reduce = useReducedMotion() ?? false;

  return (
    <section className="border-y border-slate-200/80 bg-gradient-to-b from-cyan-50/50 via-white to-white px-5 py-12 sm:px-8 sm:py-14">
      <div className="mx-auto max-w-7xl">
        <p className={`${ppEyebrow} text-center`}>Prova social</p>
        <p className="mt-2 text-center text-sm font-medium text-slate-500">
          Professores em todo o Brasil já transformaram sua rotina com o Planify
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SOCIAL_PROOF_STATS.map((stat, index) => (
            <AnimatedStat
              key={stat.label}
              target={stat.value}
              prefix={"prefix" in stat ? stat.prefix : ""}
              suffix={stat.suffix}
              label={stat.label}
              icon={stat.icon as PlanifyIconName}
              index={index}
              staticRender={reduce}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
