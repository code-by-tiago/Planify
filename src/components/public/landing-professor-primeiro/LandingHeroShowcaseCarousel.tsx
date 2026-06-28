"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { HERO_SHOWCASE_CARDS } from "./constants";

const SLIDE_MS = 3000;

export function LandingHeroShowcaseCarousel() {
  const reduceMotion = useReducedMotion() ?? false;
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progressKey, setProgressKey] = useState(0);

  const cardCount = HERO_SHOWCASE_CARDS.length;
  const activeCard = HERO_SHOWCASE_CARDS[activeIndex]!;

  const goTo = useCallback((index: number) => {
    setActiveIndex(((index % cardCount) + cardCount) % cardCount);
    setProgressKey((key) => key + 1);
  }, [cardCount]);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % cardCount);
      setProgressKey((key) => key + 1);
    }, SLIDE_MS);
    return () => window.clearInterval(timer);
  }, [paused, cardCount]);

  const enterTransition = reduceMotion
    ? { duration: 0.35, ease: "easeOut" as const }
    : { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <div
      className="relative mx-auto w-full max-w-[300px] sm:max-w-[320px] lg:max-w-[340px]"
      role="region"
      aria-roledescription="carrossel"
      aria-label="Destaques do Planify"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {activeCard.alt}
      </p>

      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[12%] h-[72%] w-[88%] -translate-x-1/2 rounded-full bg-[#26C6DA]/25 blur-3xl"
      />

      <div className="relative aspect-[9/16] overflow-hidden rounded-[1.75rem] shadow-[0_32px_64px_rgba(10,25,47,0.28),0_12px_28px_rgba(38,198,218,0.14)] ring-1 ring-[#0A192F]/10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCard.id}
            initial={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 28, scale: 0.94, filter: "blur(6px)" }
            }
            animate={
              reduceMotion
                ? { opacity: 1 }
                : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }
            }
            exit={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, y: -12, scale: 1.02, filter: "blur(4px)" }
            }
            transition={enterTransition}
            className="absolute inset-0"
          >
            <Image
              src={activeCard.src}
              alt={activeCard.alt}
              fill
              priority={activeIndex === 0}
              sizes="(min-width: 1024px) 340px, (min-width: 640px) 320px, 300px"
              className="object-cover object-top"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-5 space-y-3">
        <div
          className="h-0.5 overflow-hidden rounded-full bg-[#0A192F]/10"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progresso do slide atual"
        >
          <motion.div
            key={progressKey}
            className="h-full origin-left rounded-full bg-gradient-to-r from-[#26C6DA] to-[#0A192F]/80"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: paused ? undefined : 1 }}
            transition={
              paused
                ? { duration: 0 }
                : { duration: SLIDE_MS / 1000, ease: "linear" }
            }
            style={paused ? { scaleX: 0.35 } : undefined}
          />
        </div>

        <div className="flex items-center justify-center gap-2">
          {HERO_SHOWCASE_CARDS.map((card, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => goTo(index)}
                aria-label={`Ver destaque: ${card.alt}`}
                aria-current={isActive ? "true" : undefined}
                className={`h-2 rounded-full transition-all duration-300 ${
                  isActive
                    ? "w-7 bg-[#26C6DA]"
                    : "w-2 bg-[#0A192F]/20 hover:bg-[#26C6DA]/50"
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
