import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type { PlanifyIconName } from "@/lib/pro/planifyTools";
import { teachyHomeFeatures } from "@/lib/pro/teachyLanding";
import { ppBtnPrimary, ppEyebrow } from "./theme";

function FeatureMock({ icon }: { icon: PlanifyIconName }) {
  return (
    <div className="pf-demo-mock mx-auto w-full max-w-md p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-sm">
          <PlanifyIcon name={icon} className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-cyan-600">Planify Studio</p>
          <p className="text-sm font-extrabold text-slate-900">Prévia do material</p>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {["Rascunho gerado", "BNCC sugerida", "Pronto para editar"].map((line, i) => (
          <div
            key={line}
            className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5 text-sm font-medium text-slate-700"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan-100 text-[10px] font-bold text-cyan-700">
              {i + 1}
            </span>
            {line}
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-50 to-blue-50 px-3 py-2 text-xs font-semibold text-cyan-800">
        <PlanifyIcon name="spark" className="h-3.5 w-3.5" />
        IA pedagógica · exportação em 1 clique
      </div>
    </div>
  );
}

export function LandingStudioFeatures() {
  return (
    <section id="recursos" className="scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className={ppEyebrow}>Planify Studio</p>
          <h2 className="pf-headline mt-3 text-3xl sm:text-4xl">
            O melhor material.
            <br />
            <span className="text-cyan-600">O seu.</span>
          </h2>
        </div>

        <div className="space-y-20 sm:space-y-28">
          {teachyHomeFeatures.map((feature, index) => {
            const imageFirst = feature.imageSide === "left";
            return (
              <div
                key={feature.title}
                className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-16 ${
                  imageFirst ? "" : ""
                }`}
              >
                <div className={imageFirst ? "lg:order-2" : "lg:order-1"}>
                  <FeatureMock icon={feature.icon} />
                </div>
                <div className={imageFirst ? "lg:order-1" : "lg:order-2"}>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-600">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="pf-headline mt-3 text-2xl sm:text-3xl">{feature.title}</h3>
                  <p className="mt-4 text-base font-medium leading-7 text-slate-600">
                    {feature.description}
                  </p>
                  <Link href={feature.href} className={`${ppBtnPrimary} mt-8 inline-flex gap-2`}>
                    {feature.cta}
                    <PlanifyIcon name="arrowRight" className="h-4 w-4" />
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
