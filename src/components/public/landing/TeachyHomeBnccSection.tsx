import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { TeachyMaterialPreview } from "@/components/public/landing/TeachyMaterialPreview";

export function TeachyHomeBnccSection() {
  return (
    <section className="pl-teachy-band-wrap relative isolate overflow-hidden bg-white pb-0 pt-4">
      <div className="pl-teachy-band mx-auto max-w-[calc(100%-2rem)] sm:max-w-7xl">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-14 sm:px-8 lg:grid-cols-2 lg:py-20">
          <div>
            <h2 className="text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-[2.5rem] lg:text-5xl">
              Gere materiais baseados na BNCC,{" "}
              <span className="pl-teachy-gradient-text">instantaneamente.</span>
            </h2>
            <p className="mt-5 max-w-lg text-lg font-medium leading-8 text-slate-600">
              Aproveite 13 ferramentas com IA que geram materiais
              personalizados para seus alunos — sem prompt complexo.
            </p>
            <Link
              href="/planos"
              className="pl-teachy-cta mt-8 inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-semibold"
            >
              Ver planos
              <PlanifyIcon name="arrowRight" className="h-4 w-4" />
            </Link>
          </div>
          <TeachyMaterialPreview />
        </div>
      </div>
    </section>
  );
}
