import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";

const footerLinks = [
  { href: "/", label: "Início" },
  { href: "/planos", label: "Planos" },
  { href: "/login", label: "Entrar" },
  { href: "/contato", label: "Contato" },
];

export function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white/70">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-5 py-10 sm:px-8 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
            <PlanifyIcon name="spark" className="h-5 w-5" />
          </div>
          <div>
            <p className="text-base font-black tracking-tight text-slate-950">
              Planify
            </p>
            <p className="text-xs font-semibold text-slate-500">
              Plataforma educacional para professores.
            </p>
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {footerLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-bold text-slate-600 transition hover:text-slate-950"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <p className="text-xs font-semibold text-slate-400">
          © {year} Planify. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}

export default PublicFooter;
