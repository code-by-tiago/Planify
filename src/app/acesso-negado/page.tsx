import Link from "next/link";
import { PageShell } from "../../components/PageShell";

export default function AcessoNegadoPage() {
  return (
    <PageShell>
      <section className="mx-auto grid min-h-[70vh] max-w-4xl place-items-center px-5 py-20 text-center sm:px-8">
        <div className="rounded-[2rem] border border-rose-300/20 bg-rose-300/10 p-8 shadow-2xl shadow-rose-500/10 backdrop-blur-2xl">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-rose-200">
            Acesso restrito
          </p>

          <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-6xl">
            Você não tem permissão para acessar esta área.
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-rose-100/85">
            Esta página é restrita ao administrador do Planify ou a usuários premium autorizados.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="rounded-2xl bg-white px-6 py-4 text-sm font-black text-slate-950 transition hover:-translate-y-1 hover:bg-rose-100"
            >
              Voltar ao dashboard
            </Link>

            <Link
              href="/planos"
              className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-black text-white transition hover:-translate-y-1 hover:bg-white/10"
            >
              Ver planos
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
