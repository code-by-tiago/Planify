import type { Metadata } from "next";
import Link from "next/link";
import { PublicProfessorPrimeiroLayout } from "@/components/public/PublicProfessorPrimeiroLayout";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { ContatoClient } from "./ContatoClient";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import {
  ppBtnPrimary,
  ppBtnSecondary,
  ppEyebrow,
  ppLead,
  ppTitle,
  ppTitleAccent,
} from "@/components/public/landing-professor-primeiro/theme";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Contato e suporte",
  description:
    "Fale com o suporte do Planify IA Educacional: dúvidas sobre assinatura, acesso, parcerias e suporte pedagógico para professores.",
  path: "/contato",
});

export default function ContatoPage() {
  return (
    <PublicProfessorPrimeiroLayout>
      <section className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8 lg:py-16">
        <div className="max-w-2xl">
          <p className={ppEyebrow}>Suporte</p>
          <h1 className={`${ppTitle} mt-4`}>
            Atendimento para{" "}
            <span className={ppTitleAccent}>professores.</span>
          </h1>
          <p className={`mt-5 ${ppLead}`}>
            Dúvidas sobre assinatura, acesso, erros, sugestões, parcerias ou
            suporte pedagógico — envie sua mensagem abaixo.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/planos" className={ppBtnPrimary}>
              Ver planos
            </Link>
            <Link href="/dashboard" className={ppBtnSecondary}>
              Acessar painel
              <PlanifyIcon name="arrowRight" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <ContatoClient />
    </PublicProfessorPrimeiroLayout>
  );
}
