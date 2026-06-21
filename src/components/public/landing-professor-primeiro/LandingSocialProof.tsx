"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { SOCIAL_PROOF_STATS } from "./constants";

function formatStatValue(value: number, prefix = "", suffix = ""): string {
  const formatted = new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
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
    <span ref={ref} className="pf-marketing-stat-value">
      {formatStatValue(display, prefix, suffix)}
    </span>
  );
}

export function LandingSocialProof() {
  const reduce = useReducedMotion() ?? false;

  return (
    <section className="pf-marketing-stats pf-marketing-section">
      <div className="mx-auto max-w-[1120px]">
        <div className="pf-marketing-stats-banner">
          <p className="pf-marketing-stats-headline">
            Amada por{" "}
            <span className="pf-marketing-gradient-word">+2.500</span> educadores.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-8 lg:grid-cols-4 lg:gap-6">
          {SOCIAL_PROOF_STATS.map((stat, index) => {
            const content = (
              <div className="text-center">
                <AnimatedNumber
                  target={stat.value}
                  prefix={"prefix" in stat ? stat.prefix : ""}
                  suffix={stat.suffix}
                  staticRender={reduce}
                />
                <p className="pf-marketing-stat-label">{stat.label}</p>
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
