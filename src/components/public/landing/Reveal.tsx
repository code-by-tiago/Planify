"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** Deslocamento inicial: "up" (padrão), "left", "right" ou "none". */
  from?: "up" | "left" | "right" | "none";
  /** Renderiza o wrapper com largura total para grids/colunas. */
  as?: "div" | "li" | "section";
};

const offset = 24;

export function Reveal({
  children,
  className,
  delay = 0,
  from = "up",
  as = "div",
}: RevealProps) {
  const reduce = useReducedMotion();

  const hidden =
    reduce || from === "none"
      ? { opacity: 0 }
      : {
          opacity: 0,
          y: from === "up" ? offset : 0,
          x: from === "left" ? -offset : from === "right" ? offset : 0,
        };

  const variants: Variants = {
    hidden,
    visible: { opacity: 1, x: 0, y: 0 },
  };

  const MotionTag = motion[as];

  return (
    <MotionTag
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </MotionTag>
  );
}

export default Reveal;
