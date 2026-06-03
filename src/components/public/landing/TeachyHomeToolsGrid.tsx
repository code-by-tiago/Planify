import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { planifyTools } from "@/lib/pro/planifyTools";

export function TeachyHomeToolsGrid() {
  return (
    <section id="ferramentas" className="bg-slate-50/80 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="text-center">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
            Ferramentas com IA
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            13 geradores pedagógicos do Planify
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base font-medium text-slate-600">
            Mesma lógica das plataformas líderes: escolha a ferramenta, descreva
            o contexto e receba material pronto para revisar e exportar.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {planifyTools.map((tool) => (
            <Link
              key={tool.id}
              href={tool.href}
              className="group flex flex-col items-center rounded-2xl border border-slate-200/80 bg-white p-4 text-center transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${tool.accent} text-white shadow-sm transition group-hover:scale-105`}
              >
                <PlanifyIcon name={tool.icon} className="h-5 w-5" />
              </span>
              <span className="mt-3 line-clamp-2 text-xs font-black leading-snug text-slate-900">
                {tool.shortTitle}
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            href="/dashboard"
            className="pl-teachy-cta inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-bold text-slate-900"
          >
            Abrir todas no painel
            <PlanifyIcon name="arrowRight" className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
