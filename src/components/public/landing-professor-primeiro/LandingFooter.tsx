import Link from "next/link";
import { OwnerFooterLink } from "@/components/OwnerFooterLink";
import { PlanifyBrand } from "@/components/pro/PlanifyBrand";

const PUBLIC_LINKS = [
  { href: "/cadastro", label: "Professores" },
  { href: "/escolas", label: "Escolas & gestores" },
  { href: "/ferramentas", label: "Ferramentas IA" },
  { href: "/comunidade", label: "Comunidade docente" },
];

const SOLUTION_LINKS = [
  { href: "/planejamento-escolar-com-ia", label: "Planejamento escolar" },
  { href: "/gerador-de-atividades-com-ia", label: "Atividades com IA" },
  { href: "/gerador-de-provas-com-ia", label: "Provas com IA" },
  { href: "/gerador-de-jogos-pedagogicos", label: "Jogos pedagógicos" },
  { href: "/apostilas-com-ia-para-professores", label: "Apostilas com IA" },
  { href: "/editor-de-documentos-para-professores", label: "Editor de documentos" },
];

const RESOURCE_LINKS = [
  { href: "/#solucoes", label: "Ecossistema" },
  { href: "/#recursos", label: "Planify Studio" },
  { href: "/#ferramentas", label: "Ferramentas" },
  { href: "/planos", label: "Planos e preços" },
  { href: "/escolas", label: "Para escolas" },
];

export function LandingFooter() {
  return (
    <footer className="pf-marketing-footer px-5 py-12 pb-[max(3rem,env(safe-area-inset-bottom))] sm:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 sm:grid-cols-2 lg:grid-cols-5">
        <div className="sm:col-span-2 lg:col-span-1">
          <PlanifyBrand href="/" hideTagline />
          <p className="mt-4 max-w-xs text-sm font-normal leading-7 text-slate-500">
            Planify IA Educacional — plataforma educacional com IA para professores criarem
            planejamentos, atividades, provas e documentos editáveis.
          </p>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Públicos</p>
          <nav className="mt-4 grid gap-2.5">
            {PUBLIC_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-slate-600 transition hover:text-cyan-700"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Soluções</p>
          <nav className="mt-4 grid gap-2.5">
            {SOLUTION_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-slate-600 transition hover:text-cyan-700"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Recursos</p>
          <nav className="mt-4 grid gap-2.5">
            {RESOURCE_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-slate-600 transition hover:text-cyan-700"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Conta</p>
          <nav className="mt-4 grid gap-2.5">
            <Link
              href="/planos"
              className="text-sm font-medium text-slate-600 transition hover:text-cyan-700"
            >
              Planos
            </Link>
            <Link
              href="/status"
              className="text-sm font-medium text-slate-600 transition hover:text-cyan-700"
            >
              Status dos serviços
            </Link>
            <Link
              href="/contato"
              className="text-sm font-medium text-slate-600 transition hover:text-cyan-700"
            >
              Contato
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 transition hover:text-cyan-700"
            >
              Entrar
            </Link>
          </nav>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-7xl border-t border-slate-100 pt-6">
        <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <p className="text-xs font-medium text-slate-500">© 2026 Planify · Todos os direitos reservados</p>
          <nav className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <Link
              href="/termos"
              className="text-xs font-medium text-slate-500 transition hover:text-cyan-700"
            >
              Termos de uso
            </Link>
            <span className="text-slate-300" aria-hidden>|</span>
            <Link
              href="/privacidade"
              className="text-xs font-medium text-slate-500 transition hover:text-cyan-700"
            >
              Aviso de Privacidade
            </Link>
            <OwnerFooterLink className="text-xs hover:text-cyan-700/70" />
          </nav>
        </div>
      </div>
    </footer>
  );
}
