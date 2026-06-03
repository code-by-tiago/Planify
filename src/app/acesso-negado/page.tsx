import Link from "next/link";
import { PageShell } from "../../components/PageShell";

export default function AcessoNegadoPage() {
  return (
    <PageShell>
      <section className="mx-auto grid min-h-[50vh] max-w-4xl place-items-center px-5 py-16 text-center sm:px-8">
        <div className="rounded-[1.75rem] border border-rose-200 bg-rose-50 p-8 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-rose-600">
            Acesso restrito
          </p>

          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Você não tem permissão para acessar esta área.
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base font-medium leading-8 text-slate-600">
            Esta página é restrita ao administrador do Planify ou a usuários
            premium autorizados.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex justify-center rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-bold text-white hover:opacity-95"
            >
              Voltar ao painel
            </Link>
            <Link
              href="/planos"
              className="inline-flex justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 hover:border-indigo-200"
            >
              Ver planos
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
