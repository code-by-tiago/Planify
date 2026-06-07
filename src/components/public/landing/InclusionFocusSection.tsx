import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { Reveal } from "@/components/public/landing/Reveal";
import { InclusionFeaturePreview } from "@/components/public/landing/TeachyFeaturePreviews";
import { teachyInclusionFeature } from "@/lib/pro/teachyLanding";

export function InclusionFocusSection() {
  const feature = teachyInclusionFeature;

  return (
    <section
      id="inclusao"
      className="relative isolate scroll-mt-28 overflow-hidden py-16 sm:py-20"
      aria-labelledby="inclusion-focus-heading"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal
          from="left"
          className="pl-hud-feature-row pl-hud-feature-row--alt grid items-center gap-10 rounded-3xl p-6 sm:p-8 lg:grid-cols-2 lg:gap-16 lg:p-10"
        >
          <div className="lg:order-1">
            <span className="pl-hud-feature-step inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-700 backdrop-blur-sm">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 text-white">
                <PlanifyIcon name="spark" className="h-3 w-3" />
              </span>
              Inclusão
            </span>

            <h2
              id="inclusion-focus-heading"
              className="mt-4 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl lg:text-[2rem]"
            >
              {feature.title}
            </h2>
            <p className="mt-4 text-base font-medium leading-7 text-slate-600 sm:text-lg sm:leading-8">
              {feature.description}
            </p>

            <ul className="mt-6 space-y-3.5" role="list">
              {feature.bullets.map((item) => (
                <li key={item.label} className="flex gap-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan-400/20 bg-cyan-50/60 text-cyan-700"
                    aria-hidden
                  >
                    <PlanifyIcon name={item.icon} className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 pt-0.5">
                    <span className="block text-sm font-bold text-slate-950">{item.label}</span>
                    <span className="mt-0.5 block text-sm font-medium leading-snug text-slate-600">
                      {item.text}
                    </span>
                  </span>
                </li>
              ))}
            </ul>

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

          <div className="lg:order-2">
            <InclusionFeaturePreview />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
