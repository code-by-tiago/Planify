import Link from "next/link";
import { PlanifyBrand } from "@/components/pro/PlanifyBrand";

type PublicHeaderProps = {
  active?: "home" | "planos" | "contato";
};

const navLinks: { key: NonNullable<PublicHeaderProps["active"]>; href: string; label: string }[] = [
  { key: "home", href: "/", label: "Início" },
  { key: "planos", href: "/planos", label: "Planos" },
  { key: "contato", href: "/contato", label: "Contato" },
];

export function PublicHeader({ active }: PublicHeaderProps) {
  return (
    <header className="planify-ui3-header sticky top-0 z-50 border-b border-slate-200 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
        <PlanifyBrand href="/" />

        <nav className="hidden items-center gap-1 rounded-full border border-slate-200 bg-white/70 p-1 lg:flex">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-4 py-2 text-sm font-black transition ${
                active === item.key
                  ? "bg-slate-950 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
          >
            Entrar
          </Link>
          <Link
            href="/dashboard"
            className="rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-slate-200 transition hover:-translate-y-0.5"
          >
            Acessar painel
          </Link>
        </div>
      </div>
    </header>
  );
}

export default PublicHeader;
