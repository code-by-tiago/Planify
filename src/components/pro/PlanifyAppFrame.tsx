import Link from "next/link";
import { ReactNode } from "react";
import { PlanifyBrand } from "@/components/pro/PlanifyBrand";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { appNavigation } from "@/lib/pro/planifyTools";

type FrameProps = {
  children: ReactNode;
  active?: string;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
};

export default function PlanifyAppFrame({
  children,
  active = "",
  title = "Planify Studio",
  subtitle = "Central de criação pedagógica",
  action,
}: FrameProps) {
  return (
    <main className="min-h-screen bg-[#f6f7fb] text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[248px_1fr]">
        <aside className="hidden border-r border-slate-200 bg-white px-4 py-5 lg:block">
          <PlanifyBrand />

          <nav className="mt-7 space-y-1">
            {appNavigation.map((item) => {
              const selected = active === item.href || active === item.label;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-black transition ${
                    selected
                      ? "bg-slate-950 text-white shadow-lg shadow-slate-200"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                  }`}
                >
                  <PlanifyIcon name={item.icon} className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-7 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-black text-slate-950">
              Ambiente premium
            </p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
              Ferramentas organizadas para reduzir rolagem e acelerar a criação.
            </p>
          </div>
        </aside>

        <section className="min-w-0">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="lg:hidden">
                  <PlanifyBrand compact />
                </div>
                <div>
                  <h1 className="text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
                    {title}
                  </h1>
                  <p className="text-sm font-semibold text-slate-500">
                    {subtitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {action}
                <Link
                  href="/planos"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 transition hover:border-slate-950"
                >
                  Planos
                </Link>
              </div>
            </div>
          </header>

          {children}
        </section>
      </div>
    </main>
  );
}
