import type { Metadata } from "next";
import Link from "next/link";
import { PublicProfessorPrimeiroLayout } from "@/components/public/PublicProfessorPrimeiroLayout";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { fetchPublicStatusReport, type PublicServiceStatus } from "@/server/public/public-status-service";
import {
  ppBtnSecondary,
  ppLink,
  ppTitle,
  ppTitleAccent,
} from "@/components/public/landing-professor-primeiro/theme";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Status dos serviços",
  description:
    "Status operacional do Planify para professores: IA, autenticação e exportação.",
  path: "/status",
});

function statusBadgeClass(status: PublicServiceStatus): string {
  if (status === "operational") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
  if (status === "degraded") {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }
  return "border-rose-200 bg-rose-50 text-rose-800";
}

function statusLabel(status: PublicServiceStatus): string {
  if (status === "operational") return "Operacional";
  if (status === "degraded") return "Instável";
  return "Indisponível";
}

export default function StatusPage() {
  const report = fetchPublicStatusReport();
  const checkedAt = new Date(report.checkedAt).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });

  return (
    <PublicProfessorPrimeiroLayout>
      <main className="mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">
          Planify · Professores
        </p>
        <h1 className={`${ppTitle} mt-4`}>
          Status dos <span className={ppTitleAccent}>serviços</span>
        </h1>
        <p className="mt-4 text-sm font-medium leading-7 text-slate-600">
          Informação honesta sobre disponibilidade — sem porcentagens artificiais de uptime.
          Atualizado a cada consulta.
        </p>

        <div
          className={`mt-8 rounded-2xl border px-5 py-4 ${statusBadgeClass(report.overall)}`}
        >
          <p className="text-lg font-black">{report.headline}</p>
          <p className="mt-1 text-xs font-semibold opacity-80">
            Verificado em {checkedAt} (horário local do servidor)
          </p>
        </div>

        <div className="mt-8 grid gap-4">
          {report.checks.map((check) => (
            <section
              key={check.id}
              className={`rounded-2xl border p-5 ${statusBadgeClass(check.status)}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-black">{check.label}</h2>
                <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black">
                  {statusLabel(check.status)}
                </span>
              </div>
              <p className="mt-3 text-sm font-medium leading-6">{check.message}</p>
            </section>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700">
          <p className="font-bold text-slate-900">Sobre limites e erros 429</p>
          <p className="mt-2">
            O plano Professor inclui uma cota diária de gerações profundas com IA. Quando a
            cota esgota, você verá uma mensagem clara — a cota reinicia à meia-noite (horário
            de Brasília). Isso não indica falha do sistema.
          </p>
          <p className="mt-2">
            Se a IA estiver indisponível por manutenção ou instabilidade externa, aguarde
            alguns minutos e tente novamente.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/contato" className={ppBtnSecondary}>
            Falar com suporte
          </Link>
          <Link href="/dashboard" className={ppLink}>
            Voltar ao painel
          </Link>
        </div>
      </main>
    </PublicProfessorPrimeiroLayout>
  );
}
