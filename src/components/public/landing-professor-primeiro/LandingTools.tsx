import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { activePlanifyTools } from "@/lib/pro/planifyTools";
import { landingExtraTools } from "@/lib/pro/teachyLanding";
import { ppEyebrow } from "./theme";

export function LandingTools() {
  const tools = [...landingExtraTools, ...activePlanifyTools];

  return (
    <section
      id="ferramentas"
      className="scroll-mt-24 bg-white px-5 py-14 sm:px-8 sm:py-16"
    >
      <div className="mx-auto max-w-7xl">
        <p className={`${ppEyebrow} text-center`}>Geradores com IA</p>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {tools.map((tool) => (
            <Link
              key={tool.id}
              href={tool.href}
              className="group flex min-h-[3.25rem] items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left shadow-sm transition hover:border-[#26C6DA] hover:shadow-md"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#26C6DA]/15 text-[#26C6DA]">
                <PlanifyIcon name={tool.icon} className="h-4 w-4" />
              </span>
              <span className="text-xs font-bold leading-tight text-[#0A192F] group-hover:text-[#26C6DA] sm:text-sm">
                {tool.shortTitle}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
