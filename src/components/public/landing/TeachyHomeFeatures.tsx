import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { teachyHomeFeatures } from "@/lib/pro/teachyLanding";

function FeatureVisual({ icon }: { icon: (typeof teachyHomeFeatures)[0]["icon"] }) {
  return (
    <div className="relative isolate mx-auto w-full max-w-md overflow-hidden">
      <div
        className="pl-feature-visual-glow absolute -inset-4 hidden rounded-[2.5rem] bg-gradient-to-br from-blue-100 via-indigo-50 to-emerald-50 sm:block"
        aria-hidden
      />
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md">
          <PlanifyIcon name={icon} className="h-7 w-7" />
        </span>
        <div className="mt-6 space-y-2">
          <div className="h-3 w-4/5 rounded-full bg-slate-100" />
          <div className="h-3 w-full rounded-full bg-slate-50" />
          <div className="h-3 w-11/12 rounded-full bg-slate-50" />
        </div>
        <div className="mt-5 flex gap-2">
          <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black text-blue-700">
            BNCC
          </span>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black text-emerald-700">
            DOCX
          </span>
        </div>
      </div>
    </div>
  );
}

export function TeachyHomeFeatures() {
  return (
    <section id="como-funciona" className="relative isolate scroll-mt-28 overflow-hidden bg-white py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
            Do planejamento ao feedback,{" "}
            <span className="pl-teachy-gradient-text">tudo em um só lugar.</span>
          </h2>
          <p className="mt-5 text-lg font-medium leading-8 text-slate-600">
            Pare de ensinar da forma antiga. Eleve a qualidade das suas aulas
            enquanto economiza tempo.
          </p>
        </div>

        <div className="mt-14 space-y-20 sm:space-y-28">
          {teachyHomeFeatures.map((feature, index) => {
            const visualFirst = feature.imageSide === "left";
            return (
              <div
                key={feature.title}
                className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-16 ${
                  index > 0 ? "border-t border-slate-100 pt-16 sm:pt-20" : ""
                }`}
              >
                <div className={visualFirst ? "lg:order-1" : "lg:order-2"}>
                  <FeatureVisual icon={feature.icon} />
                </div>
                <div className={visualFirst ? "lg:order-2" : "lg:order-1"}>
                  <h3 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                    {feature.title}
                  </h3>
                  <p className="mt-4 text-base font-medium leading-7 text-slate-600">
                    {feature.description}
                  </p>
                  <Link
                    href={feature.href}
                    className="pl-teachy-cta mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-slate-900"
                  >
                    {feature.cta}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
