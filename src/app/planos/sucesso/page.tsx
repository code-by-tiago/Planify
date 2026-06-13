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
    ativar?: string;
  }>;
};

export default async function PlanosSucessoPage({
  searchParams,
}: PlanosSucessoPageProps) {
  const params = await searchParams;
  const needsEmailConfirm = params.ativar === "confirmar";

  return (
    <PublicProfessorPrimeiroLayout>
      <section className="mx-auto flex max-w-3xl flex-1 flex-col items-center justify-center px-5 py-16 text-center sm:px-8">
        <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-50 text-cyan-600">
          <PlanifyIcon name="checkCircle" className="h-8 w-8" />
        </span>

        <p className={`mt-6 ${ppEyebrow}`}>
          {needsEmailConfirm ? "Quase lá" : "Passo 1 de 2 — Pagamento ok"}
        </p>

        <h1 className={`${ppTitle} mt-4 text-3xl sm:text-4xl`}>
          {needsEmailConfirm ? (
            <>
              Confirme seu e-mail para{" "}
              <span className={ppTitleAccent}>entrar.</span>
            </>
          ) : (
            <>
              Pagamento confirmado.{" "}
              <span className={ppTitleAccent}>Ative sua conta.</span>
            </>
          )}
        </h1>

        <p className={`mt-5 ${ppLead}`}>
          {needsEmailConfirm
            ? "Seu plano já está pago. Depois de confirmar o e-mail, entre com a senha que você criou."
            : "Agora crie sua senha com o mesmo e-mail usado no checkout para acessar o painel."}
        </p>

        <div className="mt-8 w-full">
          <PlanosSucessoActions
            sessionId={params.session_id ?? null}
            needsEmailConfirm={needsEmailConfirm}
          />
        </div>
      </section>
    </PublicProfessorPrimeiroLayout>
  );
}
