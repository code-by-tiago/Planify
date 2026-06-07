"use client";

import { teachyLandingTestimonials } from "@/lib/pro/teachyLanding";

export function TeachyHomeTestimonials() {
  const items = [...teachyLandingTestimonials, ...teachyLandingTestimonials];

  return (
    <section className="pl-hud-testimonials-section overflow-hidden bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <p className="text-center text-xs font-black uppercase tracking-[0.2em] text-cyan-600">
          Depoimentos
        </p>
        <h2 className="mt-3 text-center text-2xl font-black text-slate-950 sm:text-3xl lg:text-4xl">
          A nova forma de ensinar, amada por educadores em todo o Brasil.
        </h2>
      </div>

      <div className="pl-hud-testimonials mt-10">
        <div className="pl-hud-testimonials__track gap-4">
          {items.map((item, index) => (
            <figure
              key={`${item.name}-${index}`}
              className="w-[min(100%,340px)] shrink-0 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm sm:w-[360px]"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${item.accent} text-sm font-black text-white shadow-sm`}
                >
                  {item.initials}
                </span>
                <div className="min-w-0">
                  <figcaption className="truncate text-sm font-black text-slate-950">
                    {item.name}
                  </figcaption>
                  <p className="truncate text-xs font-medium text-slate-500">
                    {item.role} · {item.school}
                  </p>
                </div>
              </div>
              <blockquote className="mt-4 text-sm font-medium leading-7 text-slate-600">
                “{item.quote}”
              </blockquote>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
