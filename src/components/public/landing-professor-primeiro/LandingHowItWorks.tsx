import Image from "next/image";
import { INTEGRATION_FEATURES } from "./constants";

export function LandingHowItWorks() {
  return (
    <section
      id="como-funciona"
      className="scroll-mt-24 bg-[#F0F9FA] px-5 py-14 sm:px-8 sm:py-16"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-extrabold leading-[1.15] tracking-tight text-[#0A192F] sm:text-4xl lg:text-[2.65rem]">
            Integração perfeita com o seu{" "}
            <span className="text-[#26C6DA]">dia a dia</span>
          </h2>

          <p className="mt-5 max-w-xl text-base font-medium leading-7 text-slate-600 sm:text-lg sm:leading-8">
            O Planify não substitui suas ferramentas atuais, ele as potencializa. Desenhado
            para praticidade e implementação imediata.
          </p>

          <ul className="mt-8 space-y-6">
            {INTEGRATION_FEATURES.map((item) => (
              <li key={item.title} className="flex gap-3">
                <span
                  className="mt-2 h-2.5 w-2.5 shrink-0 rounded-sm bg-[#26C6DA]"
                  aria-hidden
                />
                <div>
                  <h3 className="text-base font-extrabold text-[#0A192F] sm:text-lg">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-sm font-medium leading-7 text-slate-600 sm:text-base">
                    {item.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-center lg:justify-end">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm sm:p-8 lg:max-w-lg">
            <Image
              src="/brand/planify-owl-graduate.png"
              alt="Coruja Planify — mascote com óculos, capelo e livro"
              width={480}
              height={480}
              className="mx-auto h-auto w-full max-w-[320px] object-contain sm:max-w-[360px]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
