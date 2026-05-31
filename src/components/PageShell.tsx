import Link from "next/link";
import { PlanifyBrandLogo } from "./PlanifyBrandLogo";
import type { ReactNode } from "react";
import { PageBackNavigation } from "./PageBackNavigation";
import { PremiumRouteGuard } from "./PremiumRouteGuard";

type PageShellProps = {
  children: ReactNode;
};

const navItems = [
  { href: "/", label: "Início" },
  { href: "/planos", label: "Planos" },
  { href: "/contato", label: "Contato" },
];

const footerItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/planejamentos", label: "Planejamentos" },
  { href: "/materiais", label: "Materiais" },
  { href: "/biblioteca", label: "Biblioteca" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/planos", label: "Planos" },
  { href: "/contato", label: "Contato" },
];

export function PageShell({ children }: PageShellProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <PremiumRouteGuard />

      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/85 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-3"><PlanifyBrandLogo /></Link>

          <nav className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] p-1 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-5 py-3 text-sm font-black text-slate-300 transition hover:bg-white hover:text-slate-950"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/20"
            >
              Admin
            </Link>

            <Link
              href="/login"
              className="hidden rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black text-white transition hover:bg-white/10 sm:inline-flex"
            >
              Entrar
            </Link>

            <Link
              href="/dashboard"
              className="rounded-full bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-100"
            >
              Acessar painel
            </Link>
          </div>
        </div>
      </header>

      <PageBackNavigation />

      {children}

      <footer className="mt-14 border-t border-white/10 bg-slate-950 px-5 py-10 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_auto]">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 to-violet-500 text-sm font-black">
                P
              </span>
              <span className="text-xl font-black">Planify</span>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">
              Plataforma premium para professores criarem, editarem e organizarem
              planejamentos, materiais didáticos e documentos pedagógicos.
            </p>
          </div>

          <nav className="flex flex-wrap items-center gap-4 text-sm font-black text-slate-400">
            {footerItems.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-white">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}

export default PageShell;
