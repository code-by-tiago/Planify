import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { planifyTools } from "@/lib/pro/planifyTools";
import { landingExtraTools } from "@/lib/pro/planifyLanding";
import { ppEyebrow, ppTitle } from "./theme";

export function LandingTools() {
  const tools = [
    ...landingExtraTools.filter((tool) => tool.id !== "banco-questoes"),
    ...planifyTools,
  ];

  return (
    <section id="ferramentas" className="pf-marketing-section--alt pf-marketing-section scroll-mt-24">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className={ppEyebrow}>{tools.length} ferramentas IA</p>
          <h2 className={`${ppTitle} mt-3`}>Tudo que você precisa para ensinar</h2>
          <p className="mt-4 text-base font-normal leading-7 text-slate-600">
            Do planejamento BNCC à correção de redações — explore o catálogo completo de geradores
            pedagógicos do Planify.
          </p>
        </div>

        <div className="pf-marketing-tool-grid mt-12">
          {tools.map((tool) => (
            <Link key={tool.id} href={tool.href} className="pf-marketing-tool-card group">
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${tool.accent} text-white`}
              >
                <PlanifyIcon name={tool.icon} className="h-5 w-5" />
              </span>
              <span className="mt-3 text-sm font-bold text-slate-900 group-hover:text-cyan-700">
                {tool.shortTitle}
              </span>
              <span className="mt-1.5 flex-1 text-xs font-normal leading-5 text-slate-600">
                {tool.description}
              </span>
              <span className="mt-3 flex items-center gap-1 text-xs font-bold text-cyan-700">
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
