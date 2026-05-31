import Link from "next/link";
import { PageShell } from "../components/PageShell";

export default function NotFound() {
  return (
    <PageShell>
      <section className="mx-auto flex min-h-[calc(100vh-80px)] max-w-5xl items-center px-5 py-20 text-center sm:px-8">
        <div className="w-full rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 shadow-2xl backdrop-blur-2xl sm:p-12">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-300/10 text-2xl font-black text-cyan-200">
            404
          </div>

          <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-300">
            Página não encontrada
          </p>

          <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-6xl">
            Esse caminho ainda não existe no Planify.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-400">
            Volte para o dashboard, acesse planejamentos ou consulte os planos para continuar navegando.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="rounded-2xl bg-white px-6 py-4 text-sm font-black text-slate-950 transition hover:-translate-y-1 hover:bg-cyan-100"
            >
              Ir para dashboard
            </Link>

            <Link
              href="/planejamentos"
              className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-black text-white transition hover:-translate-y-1 hover:bg-white/10"
            >
              Abrir planejamentos
            </Link>

            <Link
              href="/"
              className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-black text-white transition hover:-translate-y-1 hover:bg-white/10"
            >
              Voltar ao início
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
