import { PublicProfessorPrimeiroLayout } from "@/components/public/PublicProfessorPrimeiroLayout";
import { PlanosSucessoActions } from "@/components/planos/PlanosSucessoActions";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import {
  ppEyebrow,
  ppLead,
  ppTitle,
  ppTitleAccent,
} from "@/components/public/landing-professor-primeiro/theme";

export const dynamic = "force-dynamic";

type PlanosSucessoPageProps = {
  searchParams: Promise<{
    session_id?: string;
  }>;
};

export default async function PlanosSucessoPage({
  searchParams,
}: PlanosSucessoPageProps) {
  const params = await searchParams;

  return (
    <PublicProfessorPrimeiroLayout>
      <section className="mx-auto flex max-w-2xl flex-1 flex-col items-center justify-center px-5 py-16 text-center sm:px-8">
        <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-50 text-cyan-600">
          <PlanifyIcon name="checkCircle" className="h-8 w-8" />
        </span>

        <p className={`mt-6 ${ppEyebrow}`}>Assinatura iniciada</p>

        <h1 className={`${ppTitle} mt-4 text-3xl sm:text-4xl`}>
          Pagamento processado com{" "}
          <span className={ppTitleAccent}>sucesso.</span>
        </h1>

        <p className={`mt-5 ${ppLead}`}>
          Seu plano será vinculado ao e-mail do pagamento. Crie sua senha ou
          entre na conta com esse mesmo e-mail para acessar o painel.
        </p>

        <div className="mt-8 w-full">
          <PlanosSucessoActions sessionId={params.session_id ?? null} />
        </div>
      </section>
    </PublicProfessorPrimeiroLayout>
  );
}
