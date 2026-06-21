import Link from "next/link";
import { InclusionFeaturePreview } from "@/components/public/landing/TeachyFeaturePreviews";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { ppBtnPrimary, ppEyebrow } from "./theme";

export function LandingPremiumSplit() {
  return (
    <section className="border-y border-slate-200/80 bg-slate-50/50 px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
        <article className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">Correção com IA</p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-extrabold text-slate-900 sm:text-3xl">
            Corrija provas e atividades em segundos
          </h2>
          <p className="mt-3 text-sm font-medium leading-7 text-slate-600">
            Envie as respostas, receba nota, feedback por competência e relatório da turma.
          </p>

          <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-extrabold text-slate-900">Prova — Biomas</p>
              <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-sm font-black text-emerald-700">
                9,2
              </span>
            </div>
            <div className="mt-4 flex h-20 items-end gap-1.5">
              {[35, 55, 48, 72, 65, 88, 60].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-gradient-to-t from-cyan-600 to-cyan-400"
                  style={{ height: `${h}%` }}
                  aria-hidden
                />
              ))}
            </div>
          </div>

          <Link href="/correcao" className={`${ppBtnPrimary} mt-6 inline-flex`}>
            Conhecer correção
          </Link>
        </article>

        <article className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
          <p className={ppEyebrow}>Inclusão escolar</p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-extrabold text-slate-900 sm:text-3xl">
            Adapte para cada aluno, respeite cada jornada
          </h2>
          <p className="mt-3 text-sm font-medium leading-7 text-slate-600">
            Atividades adaptadas para TEA, TDAH, dislexia e diferentes níveis de aprendizagem.
          </p>

          <div className="mt-6 scale-[0.92] origin-top">
            <InclusionFeaturePreview />
          </div>

          <ul className="mt-4 space-y-2 text-sm font-semibold text-slate-700" role="list">
            <li className="flex items-center gap-2">
              <PlanifyIcon name="checkCircle" className="h-4 w-4 text-cyan-600" />
              Adaptação de atividades
            </li>
            <li className="flex items-center gap-2">
              <PlanifyIcon name="checkCircle" className="h-4 w-4 text-cyan-600" />
              Educação inclusiva com IA
            </li>
          </ul>

          <Link href="/inclusao" className={`${ppBtnPrimary} mt-6 inline-flex`}>
            Conhecer inclusão
          </Link>
        </article>
      </div>
    </section>
  );
}
