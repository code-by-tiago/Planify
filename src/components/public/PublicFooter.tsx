import Link from "next/link";
import { OwnerFooterLink } from "@/components/OwnerFooterLink";
import { PlanifyBrand } from "@/components/pro/PlanifyBrand";
import { planifyTools, toolCategories } from "@/lib/pro/planifyTools";
import { landingPublicToolCount } from "@/lib/pro/teachyLanding";

const solutionLinks = [
  { href: "/dashboard", label: "Painel Planify" },
  { href: "/planejamentos", label: "Planejamentos BNCC" },
  { href: "/?tipo=redacao", label: "Gerador de redação" },
  { href: "/biblioteca", label: "Biblioteca" },
];

const resourceLinks = [
  { href: "/#ferramentas", label: "Ferramentas" },
  { href: "/planos", label: "Planos" },
  { href: "/escolas", label: "Para escolas" },
  { href: "/contato", label: "Contato" },
  { href: "/login", label: "Entrar" },
];

const legalLinks = [
  { href: "/privacidade", label: "Privacidade" },
  { href: "/termos", label: "Termos de uso" },
];

export function PublicFooter() {
  const year = new Date().getFullYear();
  const popularTools = planifyTools.filter((t) => t.popular);

  return (
    <footer className="pl-hud-footer border-t">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <p className="text-center text-sm font-medium text-slate-500">
          Planify — inteligência artificial para professores
        </p>

        <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <PlanifyBrand href="/" dark />
            <p className="mt-4 text-sm font-medium leading-7 text-slate-500">
              {landingPublicToolCount} ferramentas com IA, planejamentos, editor, histórico e DOCX
              oficial — tudo no mesmo painel.
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-600">
              Soluções
            </p>
            <nav className="mt-4 grid gap-2.5">
              {solutionLinks.map((item) => (
                <Link key={item.href} href={item.href} className="text-sm font-medium text-slate-500 transition hover:text-cyan-400">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-600">
              Recursos
            </p>
            <nav className="mt-4 grid gap-2.5">
              {resourceLinks.map((item) => (
                <Link key={item.href} href={item.href} className="text-sm font-medium text-slate-500 transition hover:text-cyan-400">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-600">
              Ferramentas populares
            </p>
            <nav className="mt-4 grid gap-2.5">
              {popularTools.map((item) => (
                <Link key={item.id} href={item.href} className="text-sm font-medium text-slate-500 transition hover:text-cyan-400">
                  {item.shortTitle}
                </Link>
              ))}
              <Link href="/dashboard" className="pl-hud-footer-accent text-sm font-semibold">
                Ver todas ({planifyTools.length}) →
              </Link>
            </nav>
            <p className="mt-4 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
              {toolCategories.filter((c) => c.id !== "todos").map((c) => c.label).join(" · ")}
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-cyan-500/10 pt-6 text-center sm:flex-row sm:text-left">
          <p className="text-xs font-medium text-slate-600">© {year} Planify</p>
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            {legalLinks.map((item) => (
              <Link key={item.href} href={item.href} className="text-xs font-medium text-slate-500 transition hover:text-cyan-400">
                {item.label}
              </Link>
            ))}
            <OwnerFooterLink />
          </nav>
          <p className="text-xs font-medium text-slate-600">Educação básica · BNCC · Brasil</p>
        </div>
      </div>
    </footer>
  );
}

export default PublicFooter;
