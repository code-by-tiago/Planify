import Link from "next/link";
import type { ReactNode } from "react";
import { OwnerFooterLink } from "@/components/OwnerFooterLink";
import { PlanifyBrand } from "@/components/pro/PlanifyBrand";

const INSTAGRAM_URL = "https://www.instagram.com/iaplanify/";

const FOOTER_LINKS = [
  { href: "/escolas", label: "Para escolas" },
  { href: "/testar-planejamento", label: "Teste grátis" },
  { href: "/inclusao", label: "Inclusão" },
  { href: "/pei", label: "PEI" },
  { href: "/correcao", label: "Corretor IA" },
];

function SocialIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white transition hover:border-[#26C6DA] hover:text-[#26C6DA]"
    >
      {children}
    </a>
  );
}

export function LandingFooter() {
  return (
    <footer className="bg-[#0A192F] px-5 py-12 pb-[max(3rem,env(safe-area-inset-bottom))] text-white sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <PlanifyBrand href="/" hideTagline dark />
          <p className="mt-4 max-w-xs text-sm font-medium leading-7 text-slate-400">
            Planify IA Educacional — planejamentos, atividades, provas e documentos editáveis
            alinhados à BNCC.
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          {FOOTER_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-slate-300 transition hover:text-[#26C6DA]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <SocialIcon href={INSTAGRAM_URL} label="Instagram">
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
          </SocialIcon>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-7xl border-t border-white/10 pt-6">
        <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <p className="text-xs font-medium text-slate-500">
            © 2026 Planify · Educação básica · BNCC · Brasil
          </p>
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <Link
              href="/privacidade"
              className="text-xs font-medium text-slate-500 transition hover:text-[#26C6DA]"
            >
              Privacidade
            </Link>
            <Link
              href="/termos"
              className="text-xs font-medium text-slate-500 transition hover:text-[#26C6DA]"
            >
              Termos de uso
            </Link>
            <OwnerFooterLink className="text-xs text-slate-500 hover:text-[#26C6DA]/70" />
          </nav>
        </div>
      </div>
    </footer>
  );
}
