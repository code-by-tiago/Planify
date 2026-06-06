import type { ReactNode } from "react";
import Link from "next/link";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicHeader } from "@/components/public/PublicHeader";

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
    <main className="planify-hud planify-ui3 planify-public flex min-h-screen flex-col">
      <PublicHeader />

      <article className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8 lg:py-16">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-600">
          Documento legal
        </p>
        <h1 className="pl-hud-display mt-4 text-3xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 text-base font-medium leading-7 text-slate-600">
          {subtitle}
        </p>
        <p className="mt-2 text-xs font-semibold text-slate-400">
          Última atualização: {updatedAt}
        </p>

        <div className="prose-planify mt-10 space-y-6 text-sm font-medium leading-7 text-slate-700">
          {children}
        </div>

        <div className="mt-12 flex flex-wrap gap-3 border-t border-cyan-400/15 pt-8">
          <Link href="/contato" className="pl-hud-btn-secondary rounded-xl px-5 py-2.5 text-sm font-semibold">
            Fale conosco
          </Link>
          <Link href="/privacidade" className="pl-hud-btn-secondary rounded-xl px-5 py-2.5 text-sm font-semibold">
            Privacidade
          </Link>
          <Link href="/termos" className="pl-hud-btn-secondary rounded-xl px-5 py-2.5 text-sm font-semibold">
            Termos de uso
          </Link>
        </div>
      </article>

      <PublicFooter />
    </main>
  );
}
