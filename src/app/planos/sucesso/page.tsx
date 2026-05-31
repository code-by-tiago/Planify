import Link from "next/link";
import { PageShell } from "../../../components/PageShell";

export const dynamic = "force-dynamic";

export default function PlanosSucessoPage() {
  return (
    <PageShell>
      <section className="mx-auto grid min-h-[70vh] max-w-4xl place-items-center px-5 py-20 text-center sm:px-8">
        <div className="rounded-[2.5rem] border border-emerald-300/20 bg-emerald-300/10 p-8 shadow-2xl shadow-emerald-500/10 backdrop-blur-2xl">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-emerald-200">
            Assinatura iniciada
          </p>

          <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-6xl">
            Pagamento processado pelo Stripe.
          </h1>

          <p className="mt-6 text-base leading-8 text-emerald-100/85">
            Se o webhook do Stripe já estiver configurado, seu acesso será
            liberado automaticamente. Caso esteja em ambiente local, valide o
            webhook antes de testar usuários comuns.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/login"
              className="rounded-2xl bg-white px-6 py-4 text-sm font-black text-slate-950 transition hover:-translate-y-1 hover:bg-emerald-100"
            >
              Fazer login
            </Link>

            <Link
              href="/dashboard"
              className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-black text-white transition hover:-translate-y-1 hover:bg-white/10"
            >
              Ir ao dashboard
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
