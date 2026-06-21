import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type { PlanifyIconName } from "@/lib/pro/planifyTools";
import { MATERIAIS_DIDATICOS } from "./constants";
import { ppEyebrow } from "./theme";

export function LandingMateriaisDidaticos() {
  return (
    <section
      id="materiais"
      className="scroll-mt-24 border-y border-slate-200/80 bg-slate-50/80 px-5 py-16 sm:px-8 sm:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className={ppEyebrow}>Materiais didáticos</p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Tudo que você precisa para a aula
          </h2>
          <p className="mt-4 text-base font-medium leading-7 text-slate-600">
            Gere atividades, apostilas, jogos, sequências, projetos e provas com IA — revise
            no editor e envie para a turma.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MATERIAIS_DIDATICOS.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group flex flex-col rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-lg"
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${item.accent} text-white shadow-md`}
              >
                <PlanifyIcon name={item.icon as PlanifyIconName} className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-extrabold text-slate-900 group-hover:text-cyan-700">
                {item.title}
              </h3>
              <p className="mt-2 flex-1 text-sm font-medium leading-6 text-slate-600">
                {item.description}
              </p>
              <span className="mt-4 flex items-center gap-1 text-xs font-bold text-cyan-700">
                Abrir gerador
                <PlanifyIcon
                  name="arrowRight"
                  className="h-3 w-3 transition group-hover:translate-x-0.5"
                />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
