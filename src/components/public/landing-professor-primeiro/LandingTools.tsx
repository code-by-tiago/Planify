import Link from "next/link";
import { activePlanifyTools } from "@/lib/pro/planifyTools";
import { landingExtraTools } from "@/lib/pro/teachyLanding";
import { LandingToolIconBadge } from "./LandingToolIconBadge";
import { ppEyebrow } from "./theme";

export function LandingTools() {
  const tools = [...landingExtraTools, ...activePlanifyTools];

  return (
    <section
      id="ferramentas"
      className="relative isolate scroll-mt-24 bg-white px-5 py-10 sm:px-8 sm:py-16"
    >
      <div className="mx-auto max-w-7xl">
        <p className={`${ppEyebrow} text-center`}>Geradores com IA</p>

        <div className="mt-7 grid min-w-0 grid-cols-1 gap-2.5 sm:mt-8 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
          {tools.map((tool) => (
            <Link
              key={tool.id}
              href={tool.href}
              className="group flex min-h-[3.5rem] min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-4 text-left shadow-sm transition hover:border-[#26C6DA] hover:shadow-md"
            >
              <LandingToolIconBadge accent={tool.accent} icon={tool.icon} />
              <span className="min-w-0 max-w-full overflow-hidden break-words text-xs font-bold leading-tight text-[#0A192F] group-hover:text-[#26C6DA] sm:text-sm">
                {tool.shortTitle}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
