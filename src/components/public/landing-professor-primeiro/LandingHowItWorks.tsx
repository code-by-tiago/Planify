import { HOW_IT_WORKS } from "./constants";

export function LandingHowItWorks() {
  return (
    <section id="como-funciona" className="scroll-mt-24 bg-white px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-center font-[family-name:var(--font-display)] text-3xl font-extrabold text-[#0A192F] sm:text-4xl">
          Como funciona
        </h2>

        <div className="mt-12 grid gap-10 md:grid-cols-3">
          {HOW_IT_WORKS.map((item) => (
            <article key={item.step} className="text-center">
              <span className="font-[family-name:var(--font-display)] text-5xl font-extrabold text-[#26C6DA]/80">
                {item.step}
              </span>
              <h3 className="mt-3 text-lg font-extrabold text-[#0A192F]">{item.title}</h3>
              <p className="mt-2 text-sm font-medium leading-7 text-slate-600">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
