import PlanifyAppFrame from "@/components/pro/PlanifyAppFrame";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { planifyTools, toolCategories } from "@/lib/pro/planifyTools";
import Link from "next/link";

export default function PlanifyStudioShell() {
  const principais = planifyTools.filter((tool) => tool.popular).slice(0, 6);

  return (
    <PlanifyAppFrame
      active="/dashboard"
      title="Planify Studio"
      subtitle="Ferramentas principais em um painel rápido e profissional"
      action={
        <Link
          href="/materiais"
          className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white shadow-lg shadow-slate-200"
        >
          Criar material
        </Link>
      }
    >
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="inline-flex items-center gap-2 rounded-2xl bg-blue-50 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-blue-700">
              <PlanifyIcon name="spark" className="h-4 w-4" />
              Central de criação
            </div>

            <h2 className="mt-5 max-w-2xl text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
              Crie materiais, avaliações e planejamentos sem navegar por páginas longas.
            </h2>

            <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-slate-600">
              O Planify organiza o trabalho do professor em ferramentas compactas,
              com acesso rápido ao gerador de materiais, planejamento oficial,
              editor, biblioteca e marketplace.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/materiais"
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-200 transition hover:-translate-y-0.5"
              >
                Abrir ferramentas
                <PlanifyIcon name="arrowRight" className="h-4 w-4" />
              </Link>
              <Link
                href="/planejamentos"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-slate-950"
              >
                Planejamento oficial
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <Link
              href="/planejamentos"
              className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <PlanifyIcon name="clipboard" className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-950">
                    Planejamento oficial
                  </p>
                  <p className="text-xs font-semibold text-slate-500">
                    Anual, trimestral, BNCC e DOCX
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/editor"
              className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
                  <PlanifyIcon name="editor" className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-950">
                    Editor integrado
                  </p>
                  <p className="text-xs font-semibold text-slate-500">
                    Edite e prepare materiais gerados
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </section>

        <section className="mt-5 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-950">
                Ferramentas recomendadas
              </h2>
              <p className="text-sm font-semibold text-slate-500">
                Atalhos compactos para criação diária.
              </p>
            </div>
            <Link
              href="/materiais"
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 transition hover:border-slate-950"
            >
              Ver todas
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {principais.map((tool) => (
              <Link
                key={tool.id}
                href={tool.href}
                className="group rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-1 hover:border-slate-950 hover:bg-white hover:shadow-xl"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm group-hover:bg-slate-950 group-hover:text-white">
                  <PlanifyIcon name={tool.icon} className="h-5 w-5" />
                </div>
                <p className="mt-4 text-sm font-black leading-tight text-slate-950">
                  {tool.shortTitle}
                </p>
                <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">
                  {tool.description}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {toolCategories.filter((category) => category.id !== "todos").slice(0, 6).map((category) => (
            <Link
              key={category.id}
              href={`/materiais?categoria=${category.id}`}
              className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  <PlanifyIcon name={category.icon} className="h-5 w-5" />
                </div>
                <p className="text-sm font-black text-slate-950">
                  {category.label}
                </p>
              </div>
            </Link>
          ))}
        </section>
      </div>
    </PlanifyAppFrame>
  );
}
