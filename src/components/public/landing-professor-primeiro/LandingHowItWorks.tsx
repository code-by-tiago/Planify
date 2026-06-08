import { HOW_IT_WORKS } from "./constants";

export function LandingHowItWorks() {
  return (
    <section id="como-funciona" className="scroll-mt-24 px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Como funciona
          </h2>
          <p className="mt-4 text-base font-medium leading-7 text-slate-600">
            Três passos simples do tema à aula pronta.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {HOW_IT_WORKS.map((item) => (
            <article key={item.step} className="relative text-center md:text-left">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 font-[family-name:var(--font-display)] text-xl font-extrabold text-white shadow-lg shadow-cyan-500/25">
                {item.step}
              </span>
              <h3 className="mt-5 text-xl font-extrabold text-slate-900">{item.title}</h3>
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
