import Link from "next/link";
import {
  materialModes,
  quickCreate,
  studioAreas,
} from "@/lib/studio/planifyStudioConfig";

export default function HomePage() {
  const mainAreas = studioAreas.slice(0, 6);

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <section className="mx-auto grid min-h-screen w-full max-w-7xl grid-rows-[auto_1fr] px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-white/10 bg-white/10 px-5 py-4 backdrop-blur">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-xl font-black text-slate-950">
              P
            </div>
            <div>
              <p className="text-lg font-black tracking-tight">Planify</p>
              <p className="-mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100">
                IA para professores
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 lg:flex">
            {mainAreas.map((area) => (
              <Link
                key={area.slug}
                href={area.href}
                className="rounded-2xl px-3 py-2 text-sm font-bold text-slate-300 transition hover:bg-white hover:text-slate-950"
              >
                {area.shortTitle}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-2xl border border-white/15 px-4 py-2 text-sm font-black text-white transition hover:bg-white hover:text-slate-950"
            >
              Entrar
            </Link>
            <Link
              href="/dashboard"
              className="rounded-2xl bg-white px-4 py-2 text-sm font-black text-slate-950 transition hover:-translate-y-0.5"
            >
              Abrir Studio
            </Link>
          </div>
        </header>

        <div className="grid items-center gap-8 py-8 lg:grid-cols-[0.92fr_1.08fr]">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-100">
              Planejamento, materiais e documentos em um só lugar
            </div>

            <h1 className="max-w-3xl text-5xl font-black leading-[0.92] tracking-tight sm:text-6xl lg:text-7xl">
              O estúdio de IA para o professor criar melhor e mais rápido.
            </h1>

            <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-slate-300">
              Gere planejamento oficial, apostilas, provas, slides, atividades,
              jogos pedagógicos e documentos editáveis com uma experiência
              compacta, visual e profissional.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 shadow-xl shadow-cyan-950/30 transition hover:-translate-y-1"
              >
                Começar no Studio
              </Link>
              <Link
                href="/planos"
                className="rounded-2xl border border-white/15 px-5 py-3 text-sm font-black text-white transition hover:bg-white hover:text-slate-950"
              >
                Ver planos
              </Link>
            </div>
          </div>

          <div className="rounded-[2.8rem] border border-white/10 bg-white/10 p-4 shadow-2xl shadow-black/20 backdrop-blur">
            <div className="rounded-[2.2rem] bg-white p-4 text-slate-950">
              <div className="mb-4 flex items-center justify-between gap-3 px-2">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">
                    Criar agora
                  </p>
                  <h2 className="text-2xl font-black tracking-tight">
                    Painel compacto
                  </h2>
                </div>
                <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">
                  Studio
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {quickCreate.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="rounded-3xl border border-slate-100 bg-slate-50 p-4 transition hover:-translate-y-1 hover:border-slate-950 hover:bg-white hover:shadow-xl"
                  >
                    <p className="text-3xl">{item.icon}</p>
                    <p className="mt-4 text-sm font-black">{item.label}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Criar em poucos passos
                    </p>
                  </Link>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-4 gap-2">
                {materialModes.slice(0, 8).map((mode) => (
                  <Link
                    key={mode.id}
                    href={`/materiais?tipo=${mode.id}`}
                    className="rounded-2xl bg-slate-100 px-2 py-3 text-center text-xs font-black text-slate-700 transition hover:bg-slate-950 hover:text-white"
                  >
                    <span className="block text-lg">{mode.icon}</span>
                    {mode.shortTitle}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
