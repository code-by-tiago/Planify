"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { SOCIAL_PROOF_STATS } from "./constants";

function formatStatValue(value: number, prefix = "", suffix = ""): string {
  const formatted = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(value);
  return `${prefix}${formatted}${suffix}`;
}

function AnimatedNumber({
  target,
  prefix = "",
  suffix = "",
  staticRender,
}: {
  target: number;
  prefix?: string;
  suffix?: string;
  staticRender: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [display, setDisplay] = useState(staticRender ? target : 0);

  useEffect(() => {
    if (!inView || staticRender) {
      setDisplay(target);
      return;
    }

    const duration = 1600;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, staticRender, target]);

  return (
    <span ref={ref} className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
      {formatStatValue(display, prefix, suffix)}
    </span>
  );
}

export function LandingSocialProof() {
  const reduce = useReducedMotion() ?? false;

  return (
    <section className="pf-marketing-stats border-y border-slate-200/80 bg-white px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <p className="text-center text-lg font-extrabold text-slate-900 sm:text-xl">
          Amada por{" "}
          <span className="text-cyan-600">+2.500 educadores</span>
        </p>

        <div className="mt-10 grid grid-cols-2 gap-8 lg:grid-cols-4 lg:gap-6">
          {SOCIAL_PROOF_STATS.map((stat, index) => {
            const content = (
              <div className="text-center">
                <AnimatedNumber
                  target={stat.value}
                  prefix={"prefix" in stat ? stat.prefix : ""}
                  suffix={stat.suffix}
                  staticRender={reduce}
                />
                <p className="mt-1 text-xs font-bold text-slate-500 sm:text-sm">{stat.label}</p>
              </div>
            );

            if (reduce) {
              return <div key={stat.label}>{content}</div>;
            }

            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: index * 0.06 }}
              >
                {content}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
