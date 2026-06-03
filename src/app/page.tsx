import Link from "next/link";
import { PlanifyBrand } from "@/components/pro/PlanifyBrand";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { planifyTools } from "@/lib/pro/planifyTools";

export default function HomePage() {
  const featured = planifyTools.filter((tool) => tool.popular).slice(0, 6);

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <PlanifyBrand href="/" />

          <nav className="hidden items-center gap-2 lg:flex">
            <Link
              href="/materiais"
              className="rounded-2xl px-4 py-2 text-sm font-black text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
            >
              Ferramentas
            </Link>
            <Link
              href="/planejamentos"
              className="rounded-2xl px-4 py-2 text-sm font-black text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
            >
              Planejamentos
            </Link>
            <Link
              href="/planos"
              className="rounded-2xl px-4 py-2 text-sm font-black text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
            >
              Planos
            </Link>
            <Link
              href="/contato"
              className="rounded-2xl px-4 py-2 text-sm font-black text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
            >
              Contato
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 transition hover:border-slate-950"
            >
              Entrar
            </Link>
            <Link
              href="/dashboard"
              className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white shadow-lg shadow-slate-200"
            >
              Acessar painel
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-78px)] max-w-7xl items-center gap-8 px-5 py-10 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-2xl bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-blue-700">
            <PlanifyIcon name="spark" className="h-4 w-4" />
            Plataforma educacional premium
          </div>

          <h1 className="mt-5 max-w-3xl text-5xl font-black leading-tight tracking-tight text-slate-950 sm:text-6xl">
            Ferramentas de IA para professores criarem com padrão profissional.
          </h1>

          <p className="mt-5 max-w-2xl text-lg font-semibold leading-8 text-slate-600">
            Planejamentos oficiais, materiais didáticos, provas, slides,
            atividades, editor e biblioteca em uma experiência organizada,
            compacta e pronta para uso escolar.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-200 transition hover:-translate-y-0.5"
            >
              Abrir painel
              <PlanifyIcon name="arrowRight" className="h-4 w-4" />
            </Link>
            <Link
              href="/planos"
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-slate-950"
            >
              Ver planos
            </Link>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-[#f6f7fb] p-4 shadow-xl shadow-slate-200">
          <div className="rounded-[1.6rem] border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                  Painel do professor
                </p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  Criação rápida
                </h2>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
                <PlanifyIcon name="materials" className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {featured.map((tool) => (
                <Link
                  key={tool.id}
                  href={tool.href}
                  className="group rounded-[1.3rem] border border-slate-200 bg-white p-4 transition hover:-translate-y-1 hover:border-slate-950 hover:shadow-xl"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 group-hover:bg-slate-950 group-hover:text-white">
                    <PlanifyIcon name={tool.icon} className="h-5 w-5" />
                  </div>
                  <p className="mt-3 text-sm font-black leading-tight text-slate-950">
                    {tool.shortTitle}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">
                    {tool.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
