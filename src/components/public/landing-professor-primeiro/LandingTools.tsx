import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { planifyTools } from "@/lib/pro/planifyTools";
import { landingExtraTools } from "@/lib/pro/teachyLanding";
import { ppEyebrow } from "./theme";

export function LandingTools() {
  const tools = [...landingExtraTools, ...planifyTools];

  return (
    <section
      id="ferramentas"
      className="scroll-mt-24 border-y border-slate-200/80 bg-slate-50/80 px-5 py-16 sm:px-8 sm:py-20"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className={ppEyebrow}>{tools.length} ferramentas IA</p>
          <h2 className="pf-headline mt-3 text-3xl sm:text-4xl">
            Tudo que você precisa para ensinar
          </h2>
          <p className="mt-4 text-base font-medium leading-7 text-slate-600">
            Do planejamento BNCC à correção de redações — explore o catálogo completo de geradores
            pedagógicos do Planify.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <Link
              key={tool.id}
              href={tool.href}
              className="group flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-cyan-200 hover:shadow-md"
            >
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${tool.accent} text-white shadow-sm`}
              >
                <PlanifyIcon name={tool.icon} className="h-5 w-5" />
              </span>
              <span className="mt-4 text-base font-extrabold text-slate-900 group-hover:text-cyan-700">
                {tool.shortTitle}
              </span>
              <span className="mt-2 flex-1 text-sm font-medium leading-6 text-slate-600">
                {tool.description}
              </span>
              <span className="mt-4 flex items-center gap-1 text-xs font-bold text-cyan-700">
                Acessar
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
