"use client";

import { teachyLandingTestimonials } from "@/lib/pro/teachyLanding";

export function TeachyHomeTestimonials() {
  const items = [...teachyLandingTestimonials, ...teachyLandingTestimonials];

  return (
    <section className="overflow-hidden bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <h2 className="text-center text-2xl font-black text-slate-950 sm:text-3xl lg:text-4xl">
          A nova forma de ensinar, amada por educadores em todo o mundo.
        </h2>
      </div>

      <div className="pl-teachy-testimonials mt-10">
        <div className="pl-teachy-testimonials__track gap-4">
          {items.map((item, index) => (
            <figure
              key={`${item.name}-${index}`}
              className="w-[min(100%,320px)] shrink-0 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm sm:w-[340px]"
            >
              <blockquote className="text-sm font-medium leading-7 text-slate-600">
                “{item.quote}”
              </blockquote>
              <figcaption className="mt-5 text-sm font-black text-slate-950">
                {item.name}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
