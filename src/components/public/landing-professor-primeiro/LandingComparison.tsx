import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { COMPARISON_ROWS } from "./constants";
import { ppEyebrow } from "./theme";

export function LandingComparison() {
  return (
    <section className="scroll-mt-24 bg-[#F0F9FA] px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <p className={ppEyebrow}>Sem Planify x Com Planify</p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-[#0A192F] sm:text-4xl">
            O que muda no seu dia a dia
          </h2>
        </div>

        <div className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
          <div className="grid grid-cols-1 gap-px bg-slate-100 sm:grid-cols-[1fr_1.15fr_1.15fr]">
            <div className="hidden bg-white px-6 py-4 sm:block" />
            <div className="hidden bg-white px-6 py-4 text-center text-xs font-bold uppercase tracking-wide text-slate-400 sm:block">
              Sem Planify
            </div>
            <div className="hidden bg-white px-6 py-4 text-center text-xs font-bold uppercase tracking-wide text-[#26C6DA] sm:block">
              Com Planify
            </div>
          </div>

          {COMPARISON_ROWS.map((row) => (
            <div
              key={row.topic}
              className="grid grid-cols-1 gap-px bg-slate-100 sm:grid-cols-[1fr_1.15fr_1.15fr]"
            >
              <div className="bg-white px-6 py-5">
                <p className="text-sm font-extrabold text-[#0A192F]">{row.topic}</p>
              </div>
              <div className="flex items-start gap-2.5 bg-white px-6 py-5 sm:items-center">
                <PlanifyIcon name="close" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300 sm:mt-0" />
                <p className="text-sm leading-6 text-slate-500">{row.without}</p>
              </div>
              <div className="flex items-start gap-2.5 bg-white px-6 py-5 sm:items-center">
                <PlanifyIcon name="checkCircle" className="mt-0.5 h-4 w-4 shrink-0 text-[#26C6DA] sm:mt-0" />
                <p className="text-sm font-medium leading-6 text-[#0A192F]">{row.with}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
