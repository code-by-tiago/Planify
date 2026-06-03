import Link from "next/link";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";

export const dynamic = "force-dynamic";

export default function PlanosSucessoPage() {
  return (
    <main className="planify-ui3 planify-public flex min-h-screen flex-col">
      <PublicHeader active="planos" />

      <section className="mx-auto flex max-w-2xl flex-1 flex-col items-center justify-center px-5 py-16 text-center sm:px-8">
        <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600">
          <PlanifyIcon name="checkCircle" className="h-8 w-8" />
        </span>

        <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
          Assinatura iniciada
        </p>

        <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
          Pagamento processado com{" "}
          <span className="pl-gradient-text">sucesso.</span>
        </h1>

        <p className="mt-5 text-base font-medium leading-7 text-slate-600">
          Se o webhook do Stripe estiver configurado, seu acesso premium será
          liberado automaticamente. Em ambiente local, valide o webhook antes de
          testar com usuários comuns.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-7 py-3.5 text-sm font-bold text-white hover:opacity-95"
          >
            Fazer login
          </Link>
          <Link
            href="/dashboard"
            className="pl-btn-brand inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold text-slate-900"
          >
            Ir ao painel
            <PlanifyIcon name="arrowRight" className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
