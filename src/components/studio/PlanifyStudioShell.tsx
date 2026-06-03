import Link from "next/link";
import { quickCreate, studioAreas } from "@/lib/studio/planifyStudioConfig";

function PlanifyLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-xl text-white shadow-lg shadow-slate-300">
        P
      </div>
      <div>
        <p className="text-lg font-black tracking-tight text-slate-950">
          Planify
        </p>
        <p className="-mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
          Studio
        </p>
      </div>
    </div>
  );
}

export default function PlanifyStudioShell() {
  const featured = studioAreas.filter((area) => area.featured);
  const secondary = studioAreas.filter((area) => !area.featured);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#eef6ff_0,#f8fafc_32%,#ffffff_72%)] text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-white/80 bg-white/80 px-5 py-4 shadow-xl shadow-slate-200/70 backdrop-blur">
          <PlanifyLogo />

          <nav className="hidden items-center gap-2 lg:flex">
            {studioAreas.slice(0, 6).map((area) => (
              <Link
                key={area.slug}
                href={area.href}
                className="rounded-2xl px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-950 hover:text-white"
              >
                {area.shortTitle}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/planos"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm transition hover:border-slate-950"
            >
              Planos
            </Link>
            <Link
              href="/planejamentos"
              className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white shadow-lg shadow-slate-300 transition hover:-translate-y-0.5"
            >
              Criar agora
            </Link>
          </div>
        </header>

        <section className="grid flex-1 gap-4 py-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex min-h-[560px] flex-col justify-between overflow-hidden rounded-[2.4rem] border border-white bg-slate-950 p-6 text-white shadow-2xl shadow-slate-300 lg:p-8">
            <div>
              <div className="mb-6 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-100">
                Central de criação pedagógica
              </div>

              <h1 className="max-w-2xl text-4xl font-black leading-[0.95] tracking-tight sm:text-5xl lg:text-6xl">
                Crie aulas, documentos e materiais sem se perder em páginas
                gigantes.
              </h1>

              <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-slate-300 sm:text-lg">
                Um painel único, rápido e visual para professores: planejamento
                oficial, materiais, provas, jogos, editor, biblioteca e
                marketplace no mesmo fluxo.
              </p>
            </div>

            <div className="mt-8">
              <p className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-slate-400">
                Criação rápida
              </p>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {quickCreate.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="group rounded-3xl border border-white/10 bg-white/10 p-4 transition hover:-translate-y-1 hover:bg-white hover:text-slate-950"
                  >
                    <div className="text-2xl">{item.icon}</div>
                    <div className="mt-3 text-sm font-black">{item.label}</div>
                    <div className="mt-2 text-xs font-semibold text-slate-400 group-hover:text-slate-500">
                      Abrir ferramenta
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              {featured.map((area) => (
                <Link
                  key={area.slug}
                  href={area.href}
                  className="group relative overflow-hidden rounded-[2.2rem] border border-white bg-white p-6 shadow-xl shadow-slate-200 transition hover:-translate-y-1"
                >
                  <div
                    className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${area.accent}`}
                  />
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 text-3xl">
                      {area.icon}
                    </div>
                    {area.badge ? (
                      <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">
                        {area.badge}
                      </span>
                    ) : null}
                  </div>
                  <h2 className="mt-5 text-2xl font-black tracking-tight text-slate-950">
                    {area.title}
                  </h2>
                  <p className="mt-1 text-sm font-bold text-slate-500">
                    {area.subtitle}
                  </p>
                  <p className="mt-4 text-sm leading-6 text-slate-600">
                    {area.description}
                  </p>
                  <div className="mt-6 inline-flex items-center gap-2 text-sm font-black text-slate-950">
                    Entrar
                    <span className="transition group-hover:translate-x-1">
                      →
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="rounded-[2.2rem] border border-white bg-white/80 p-4 shadow-xl shadow-slate-200 backdrop-blur">
              <div className="mb-3 flex items-center justify-between gap-3 px-2">
                <div>
                  <h2 className="text-lg font-black text-slate-950">
                    Ferramentas do Planify
                  </h2>
                  <p className="text-sm font-medium text-slate-500">
                    Tudo em cards compactos, sem rolagem desnecessária.
                  </p>
                </div>
                <span className="hidden rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 sm:inline-flex">
                  Premium
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {secondary.map((area) => (
                  <Link
                    key={area.slug}
                    href={area.href}
                    className="group rounded-3xl border border-slate-100 bg-white p-4 transition hover:-translate-y-1 hover:border-slate-950 hover:shadow-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                        {area.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-950">
                          {area.shortTitle}
                        </p>
                        <p className="truncate text-xs font-semibold text-slate-500">
                          {area.subtitle}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[2rem] border border-cyan-100 bg-cyan-50 p-5">
                <p className="text-2xl">⚡</p>
                <p className="mt-3 text-sm font-black text-slate-950">
                  Fluxo rápido
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Menos campos na tela e mais decisão guiada por tipo.
                </p>
              </div>
              <div className="rounded-[2rem] border border-violet-100 bg-violet-50 p-5">
                <p className="text-2xl">🎯</p>
                <p className="mt-3 text-sm font-black text-slate-950">
                  Motores separados
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Apostila, prova, slides e jogos não se misturam.
                </p>
              </div>
              <div className="rounded-[2rem] border border-emerald-100 bg-emerald-50 p-5">
                <p className="text-2xl">🧠</p>
                <p className="mt-3 text-sm font-black text-slate-950">
                  IA integrada
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Mantém a geração do Planify com backend próprio.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}