"use client";

import { motion, useReducedMotion } from "framer-motion";
import { FEATURED_TESTIMONIAL, TESTIMONIALS } from "./constants";
import { ppBadge, ppEyebrow } from "./theme";
import { useLandingMobileStatic } from "./useLandingMobileStatic";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} de 5 estrelas`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          className={`h-4 w-4 ${i < rating ? "text-cyan-500" : "text-slate-200"}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

const featuredClassName =
  "relative mx-auto mt-12 max-w-3xl overflow-hidden rounded-3xl border border-cyan-200/80 bg-gradient-to-br from-cyan-50/80 via-white to-sky-50/50 p-8 shadow-md sm:p-10";

function FeaturedTestimonialContent() {
  return (
    <>
      <div
        className="pointer-events-none absolute -left-2 -top-4 font-[family-name:var(--font-display)] text-8xl font-extrabold leading-none text-cyan-200/60"
        aria-hidden
      >
        &ldquo;
      </div>
      <StarRating rating={FEATURED_TESTIMONIAL.rating} />
      <p className="relative mt-4 text-lg font-medium leading-8 text-slate-800 sm:text-xl">
        {FEATURED_TESTIMONIAL.quote}
      </p>
      <footer className="relative mt-6 flex flex-wrap items-center gap-3 border-t border-cyan-100 pt-5">
        <div>
          <p className="text-sm font-extrabold text-slate-900">{FEATURED_TESTIMONIAL.name}</p>
          <p className="mt-0.5 text-xs font-medium text-slate-500">
            {FEATURED_TESTIMONIAL.role}
          </p>
        </div>
        <span className={ppBadge}>{FEATURED_TESTIMONIAL.badge}</span>
      </footer>
    </>
  );
}

function TestimonialCardContent({
  item,
}: {
  item: (typeof TESTIMONIALS)[number];
}) {
  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <StarRating rating={item.rating} />
        {item.badge ? (
          <span className="shrink-0 rounded-full border border-cyan-100 bg-cyan-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cyan-800">
            {item.badge}
          </span>
        ) : null}
      </div>
      <p className="mt-4 flex-1 text-sm font-medium leading-7 text-slate-700">
        &ldquo;{item.quote}&rdquo;
      </p>
      <footer className="mt-5 border-t border-slate-200 pt-4">
        <p className="text-sm font-extrabold text-slate-900">{item.name}</p>
        <p className="mt-0.5 text-xs font-medium text-slate-500">{item.role}</p>
      </footer>
    </>
  );
}

export function LandingTestimonials() {
  const reduce = useReducedMotion();
  const mobileStatic = useLandingMobileStatic();
  const staticRender = reduce || mobileStatic;

  const cardClassName =
    "flex h-full flex-col rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6 transition hover:border-cyan-200 hover:shadow-md";

  return (
    <section className="border-t border-slate-200/80 bg-white px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-600 via-cyan-500 to-blue-600 px-6 py-4 text-center shadow-lg shadow-cyan-500/20 sm:px-8">
          <p className="text-sm font-extrabold tracking-wide text-white sm:text-base">
            Professores de todo o Brasil já usam o Planify
          </p>
        </div>

        <div className="mt-12 text-center">
          <p className={ppEyebrow}>Depoimentos</p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Professores que usam e recomendam
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base font-medium text-slate-600">
            Educadores de diferentes disciplinas e etapas compartilham como o Planify simplificou
            sua rotina.
          </p>
        </div>

        {staticRender ? (
          <blockquote className={featuredClassName}>
            <FeaturedTestimonialContent />
          </blockquote>
        ) : (
          <motion.blockquote
            className={featuredClassName}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <FeaturedTestimonialContent />
          </motion.blockquote>
        )}

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TESTIMONIALS.map((item, index) =>
            staticRender ? (
              <blockquote key={item.name} className={cardClassName}>
                <TestimonialCardContent item={item} />
              </blockquote>
            ) : (
              <motion.blockquote
                key={item.name}
                className={cardClassName}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
              >
                <TestimonialCardContent item={item} />
              </motion.blockquote>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
