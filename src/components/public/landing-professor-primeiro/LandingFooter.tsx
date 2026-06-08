import Link from "next/link";
import { PlanifyBrand } from "@/components/pro/PlanifyBrand";

const PRODUCT_LINKS = [
  { href: "/planejamentos", label: "Planejamentos" },
  { href: "/materiais", label: "Materiais" },
  { href: "/editor", label: "Editor" },
  { href: "/biblioteca", label: "Biblioteca" },
];

const RESOURCE_LINKS = [
  { href: "/#recursos", label: "Recursos" },
  { href: "/#como-funciona", label: "Como funciona" },
  { href: "/escolas", label: "Para escolas" },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white px-5 py-12 sm:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <PlanifyBrand href="/" hideTagline />
          <p className="mt-4 max-w-xs text-sm font-medium leading-7 text-slate-500">
            IA pedagógica para professores — planejamentos, materiais e exportação DOCX.
          </p>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Produto</p>
          <nav className="mt-4 grid gap-2.5">
            {PRODUCT_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-slate-600 transition hover:text-emerald-700"
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
                className="text-sm font-medium text-slate-600 transition hover:text-emerald-700"
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
              className="text-sm font-medium text-slate-600 transition hover:text-emerald-700"
            >
              Planos
            </Link>
            <Link
              href="/contato"
              className="text-sm font-medium text-slate-600 transition hover:text-emerald-700"
            >
              Contato
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 transition hover:text-emerald-700"
            >
              Entrar
            </Link>
          </nav>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-7xl border-t border-slate-100 pt-6 text-center">
        <p className="text-xs font-medium text-slate-500">© 2026 Planify</p>
      </div>
    </footer>
  );
}
