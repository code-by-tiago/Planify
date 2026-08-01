import type { ReactNode } from "react";
import Link from "next/link";
import { PublicProfessorPrimeiroLayout } from "@/components/public/PublicProfessorPrimeiroLayout";
import {
  ppBtnSecondary,
  ppCardLg,
  ppEyebrow,
  ppTitle,
} from "@/components/public/landing-professor-primeiro/theme";

type LegalPageShellProps = {
  title: string;
  subtitle: string;
  updatedAt: string;
  children: ReactNode;
};

export function LegalPageShell({
  title,
  subtitle,
  updatedAt,
  children,
}: LegalPageShellProps) {
  return (
    <PublicProfessorPrimeiroLayout>
      <article className="mx-auto w-full max-w-3xl flex-1 px-5 py-12 sm:px-8 lg:py-16">
        <div className={`${ppCardLg} p-8 sm:p-10`}>
          <p className={ppEyebrow}>Documento legal</p>
          <h1 className={`${ppTitle} mt-4 text-3xl sm:text-4xl`}>{title}</h1>
          <p className="mt-4 text-base font-medium leading-7 text-slate-600">{subtitle}</p>
          <p className="mt-2 text-xs font-semibold text-slate-400">
            Última atualização: {updatedAt}
          </p>

          <div className="prose-planify mt-10 space-y-6 text-sm font-medium leading-7 text-slate-700">
            {children}
          </div>

          <div className="mt-12 flex flex-wrap gap-3 border-t border-slate-100 pt-8">
            <Link href="/contato" className={ppBtnSecondary}>
              Fale conosco
            </Link>
            <Link href="/privacidade" className={ppBtnSecondary}>
              Privacidade
            </Link>
            <Link href="/termos" className={ppBtnSecondary}>
              Termos de uso
            </Link>
          </div>
        </div>
      </article>
    </PublicProfessorPrimeiroLayout>
  );
}
