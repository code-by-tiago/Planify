import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { Reveal } from "@/components/public/landing/Reveal";
import { TeachyFeaturePreview } from "@/components/public/landing/TeachyFeaturePreviews";
import { teachyHomeFeatures } from "@/lib/pro/teachyLanding";

export function TeachyHomeFeatures() {
  return (
    <section
      id="como-funciona"
      className="pl-hud-features relative isolate scroll-mt-28 overflow-hidden py-16 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-600">
            Como funciona
          </p>
          <h2 className="pl-display mt-3 text-3xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
            Do planejamento ao feedback,{" "}
            <span className="pl-hud-gradient-text">tudo em um só lugar.</span>
          </h2>
          <p className="mt-5 text-lg font-medium leading-8 text-slate-600">
            Pare de ensinar da forma antiga. Eleve a qualidade das suas aulas
            enquanto economiza tempo.
          </p>
        </Reveal>

        <div className="mt-16 space-y-6 sm:mt-20 sm:space-y-8">
          {teachyHomeFeatures.map((feature, index) => {
            const visualFirst = feature.imageSide === "left";
            const isAlt = index % 2 === 1;

            return (
              <Reveal
                key={feature.title}
                delay={index * 0.06}
                from={visualFirst ? "left" : "right"}
                className={`pl-hud-feature-row grid items-center gap-10 rounded-3xl p-6 sm:p-8 lg:grid-cols-2 lg:gap-16 lg:p-10 ${
                  isAlt ? "pl-hud-feature-row--alt" : ""
                }`}
              >
                <div className={visualFirst ? "lg:order-1" : "lg:order-2"}>
                  <TeachyFeaturePreview icon={feature.icon} />
                </div>

                <div className={visualFirst ? "lg:order-2" : "lg:order-1"}>
                  <span className="pl-hud-feature-step inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-700 backdrop-blur-sm">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 text-[10px] font-black text-white">
                      {index + 1}
                    </span>
                    Passo {index + 1}
                  </span>

                  <h3 className="mt-4 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl lg:text-[2rem]">
                    {feature.title}
                  </h3>
                  <p className="mt-4 text-base font-medium leading-7 text-slate-600 sm:text-lg sm:leading-8">
                    {feature.description}
                  </p>
                  <Link
                    href={feature.href}
                    className="pl-hud-btn group mt-7 inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold"
                  >
                    {feature.cta}
                    <PlanifyIcon
                      name="arrowRight"
                      className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-0.5"
                    />
                  </Link>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
