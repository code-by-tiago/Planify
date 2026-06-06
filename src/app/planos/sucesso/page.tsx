import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PlanosSucessoActions } from "@/components/planos/PlanosSucessoActions";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";

export const dynamic = "force-dynamic";

export default function PlanosSucessoPage() {
  return (
    <main className="planify-institutional planify-ui3 planify-public planify-teachy-landing flex min-h-screen flex-col bg-white">
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
          Assim que o pagamento for confirmado, seu plano é vinculado ao e-mail
          da conta e o acesso premium é liberado automaticamente.
        </p>

        <div className="mt-8 w-full">
          <PlanosSucessoActions />
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
