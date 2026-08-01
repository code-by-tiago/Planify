import Link from "next/link";
import { PageShell } from "../components/PageShell";

export default function NotFound() {
  return (
    <PageShell>
      <section className="mx-auto flex min-h-[50vh] max-w-5xl items-center px-5 py-16 text-center sm:px-8">
        <div className="w-full rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-2xl font-black text-indigo-600">
            404
          </div>

          <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">
            Página não encontrada
          </p>

          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Esse caminho ainda não existe no Planify.
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base font-medium leading-8 text-slate-600">
            Volte ao painel, abra planejamentos ou consulte os planos para
            continuar.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex justify-center rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-bold text-white hover:opacity-95"
            >
              Ir ao painel
            </Link>
            <Link
              href="/planejamentos"
              className="inline-flex justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 hover:border-indigo-200"
            >
              Planejamentos
            </Link>
            <Link
              href="/planos"
              className="inline-flex justify-center rounded-full border border-slate-200 px-6 py-3 text-sm font-bold text-slate-600 hover:text-indigo-700"
            >
              Ver planos
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
