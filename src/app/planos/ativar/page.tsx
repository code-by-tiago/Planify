import { PublicProfessorPrimeiroLayout } from "@/components/public/PublicProfessorPrimeiroLayout";
import { PlanosAtivarContaForm } from "@/components/planos/PlanosAtivarContaForm";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import {
  ppEyebrow,
  ppLead,
  ppTitle,
  ppTitleAccent,
} from "@/components/public/landing-professor-primeiro/theme";

export const dynamic = "force-dynamic";

export default function PlanosAtivarPage() {
  return (
    <PublicProfessorPrimeiroLayout>
      <section className="mx-auto flex max-w-3xl flex-1 flex-col items-center justify-center px-5 py-16 text-center sm:px-8">
        <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-50 text-cyan-600">
          <PlanifyIcon name="lock" className="h-8 w-8" />
        </span>

        <p className={`mt-6 ${ppEyebrow}`}>Já assinei — criar senha</p>

        <h1 className={`${ppTitle} mt-4 text-3xl sm:text-4xl`}>
          Ative sua conta com o{" "}
          <span className={ppTitleAccent}>e-mail do pagamento.</span>
        </h1>

        <p className={`mt-5 ${ppLead}`}>
          Se você acabou de pagar e fechou a página de confirmação, use o mesmo
          e-mail do checkout para criar sua senha. Se ainda tiver o link de
          sucesso do pagamento, cole o código da sessão no formulário para
          validação mais rápida.
        </p>

        <div className="mt-8 w-full">
          <PlanosAtivarContaForm recoveryMode />
        </div>
      </section>
    </PublicProfessorPrimeiroLayout>
  );
}
