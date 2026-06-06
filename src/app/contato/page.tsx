import Link from "next/link";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { ContatoClient } from "./ContatoClient";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";

export const dynamic = "force-dynamic";

export default function ContatoPage() {
  return (
    <main className="planify-hud planify-ui3 planify-public flex min-h-screen flex-col">
      <PublicHeader active="contato" />

      <section className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8 lg:py-16">
        <div className="max-w-2xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
            Suporte
          </p>
          <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
            Atendimento para{" "}
            <span className="pl-hud-gradient-text">professores.</span>
          </h1>
          <p className="mt-5 text-lg font-medium leading-8 text-slate-600">
            Dúvidas sobre assinatura, acesso, erros, sugestões, parcerias ou
            suporte pedagógico — envie sua mensagem abaixo.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/planos"
              className="pl-btn-brand inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-slate-900"
            >
              Ver planos
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-6 py-3 text-sm font-bold text-slate-700 hover:border-blue-200"
            >
              Acessar painel
              <PlanifyIcon name="arrowRight" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <ContatoClient />

      <PublicFooter />
    </main>
  );
}
