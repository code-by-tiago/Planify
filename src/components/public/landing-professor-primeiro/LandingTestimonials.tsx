import { TESTIMONIALS } from "./constants";

export function LandingTestimonials() {
  return (
    <section className="border-t border-slate-200/80 bg-white px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-center font-[family-name:var(--font-display)] text-3xl font-extrabold text-slate-900 sm:text-4xl">
          Professores que usam e recomendam
        </h2>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TESTIMONIALS.map((item) => (
            <blockquote
              key={item.name}
              className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6"
            >
              <p className="flex-1 text-sm font-medium leading-7 text-slate-700">
                &ldquo;{item.quote}&rdquo;
              </p>
              <footer className="mt-5 border-t border-slate-200 pt-4">
                <p className="text-sm font-extrabold text-slate-900">{item.name}</p>
                <p className="mt-0.5 text-xs font-medium text-slate-500">{item.role}</p>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
