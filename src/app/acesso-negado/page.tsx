import Link from "next/link";
import { PublicProfessorPrimeiroLayout } from "@/components/public/PublicProfessorPrimeiroLayout";
import {
  ppBtnPrimary,
  ppBtnSecondary,
  ppCardLg,
  ppEyebrow,
  ppTitle,
} from "@/components/public/landing-professor-primeiro/theme";

export default function AcessoNegadoPage() {
  return (
    <PublicProfessorPrimeiroLayout>
      <section className="mx-auto grid min-h-[50vh] max-w-4xl flex-1 place-items-center px-5 py-16 text-center sm:px-8">
        <div className={`${ppCardLg} border-rose-200 bg-rose-50/80 p-8`}>
          <p className={`${ppEyebrow} text-rose-600`}>Acesso restrito</p>

          <h1 className={`${ppTitle} mt-4 text-3xl sm:text-4xl`}>
            Você não tem permissão para acessar esta área.
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base font-medium leading-8 text-slate-600">
            Esta página é restrita ao administrador do Planify ou a usuários
            premium autorizados.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/dashboard" className={ppBtnPrimary}>
              Voltar ao painel
            </Link>
            <Link href="/planos" className={ppBtnSecondary}>
              Ver planos
            </Link>
          </div>
        </div>
      </section>
    </PublicProfessorPrimeiroLayout>
  );
}
