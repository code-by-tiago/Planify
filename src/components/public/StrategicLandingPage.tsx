import Link from "next/link";
import { PublicProfessorPrimeiroLayout } from "@/components/public/PublicProfessorPrimeiroLayout";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type { StrategicPageContent } from "@/lib/seo/strategic-pages";
import {
  ppBtnGhost,
  ppBtnPrimary,
  ppBtnSecondary,
  ppCtaBand,
  ppEyebrow,
  ppLead,
  ppLink,
  ppSectionAlt,
  ppTitle,
  ppTitleAccent,
} from "@/components/public/landing-professor-primeiro/theme";

type StrategicLandingPageProps = {
  content: StrategicPageContent;
};

export function StrategicLandingPage({ content }: StrategicLandingPageProps) {
  return (
    <PublicProfessorPrimeiroLayout>
      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:py-20">
        <div className="max-w-3xl">
          <p className={ppEyebrow}>{content.eyebrow}</p>
          <h1 className={`${ppTitle} mt-4`}>
            {content.h1}{" "}
            <span className={ppTitleAccent}>{content.h1Accent}</span>
          </h1>
          <p className={`mt-5 max-w-2xl ${ppLead}`}>{content.lead}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/login" className={ppBtnPrimary}>
              Começar no Planify
            </Link>
            <Link href="/planos" className={ppBtnSecondary}>
              Ver planos
            </Link>
          </div>
        </div>
      </section>

      <section className={`${ppSectionAlt} py-14 sm:py-16`}>
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <h2 className={`${ppTitle} text-3xl sm:text-4xl`}>
            Benefícios{" "}
            <span className={ppTitleAccent}>para o professor</span>
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {content.benefits.map((item) => (
              <article
                key={item.title}
                className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                  <PlanifyIcon name={item.icon} className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-lg font-black text-slate-950">{item.title}</h3>
                <p className="mt-3 flex-1 text-sm font-medium leading-7 text-slate-600">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-16">
        <h2 className={`${ppTitle} text-3xl sm:text-4xl`}>
          Como funciona{" "}
          <span className={ppTitleAccent}>no Planify</span>
        </h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {content.steps.map((item) => (
            <li
              key={item.step}
              className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-cyan-600 text-sm font-black text-white">
                {item.step}
              </span>
              <h3 className="mt-4 text-lg font-black text-slate-950">{item.title}</h3>
              <p className="mt-2 text-sm font-medium leading-7 text-slate-600">
                {item.description}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-8 sm:px-8">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8">
          <h2 className="text-xl font-black text-slate-950">Veja também</h2>
          <nav className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
            {content.relatedLinks.map((link) => (
              <Link key={link.href} href={link.href} className={ppLink}>
                {link.label}
              </Link>
            ))}
            <Link href="/contato" className={ppLink}>
              Contato
            </Link>
          </nav>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8">
        <div className={ppCtaBand}>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-200/90">
            Próximo passo
          </p>
          <h2 className="mt-2 text-2xl font-extrabold text-white sm:text-3xl">
            Crie sua conta e use o Planify
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm font-medium leading-7 text-slate-300">
            Acesse os geradores com IA, revise no editor integrado e exporte ao Google Docs.
            Plano Professor único por R$ 24,90/mês com uso generoso.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/login" className={ppBtnPrimary}>
              Criar conta
            </Link>
            <Link href="/planos" className={ppBtnGhost}>
              Ver plano Professor
            </Link>
          </div>
        </div>
      </section>
    </PublicProfessorPrimeiroLayout>
  );
}
