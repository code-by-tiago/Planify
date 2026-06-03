import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";

const footerColumns: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Produto",
    links: [
      { href: "/", label: "Início" },
      { href: "/#recursos", label: "Ferramentas" },
      { href: "/planos", label: "Planos" },
    ],
  },
  {
    title: "Conta",
    links: [
      { href: "/login", label: "Entrar" },
      { href: "/dashboard", label: "Acessar painel" },
    ],
  },
  {
    title: "Suporte",
    links: [
      { href: "/contato", label: "Contato" },
      { href: "/planos", label: "Dúvidas sobre planos" },
    ],
  },
];

export function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white/70">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
                <PlanifyIcon name="spark" className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-black tracking-tight text-slate-950">
                  Planify
                </p>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  Studio
                </p>
              </div>
            </div>
            <p className="mt-5 text-sm font-semibold leading-7 text-slate-600">
              Inteligência artificial, alinhamento à BNCC e exportação em DOCX
              oficial para professores criarem aulas e materiais em minutos.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-600">
                <PlanifyIcon name="checkCircle" className="h-3.5 w-3.5 text-emerald-600" />
                Alinhado à BNCC
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-600">
                <PlanifyIcon name="fileText" className="h-3.5 w-3.5 text-indigo-600" />
                DOCX oficial
              </span>
            </div>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                {column.title}
              </p>
              <nav className="mt-4 grid gap-3">
                {column.links.map((item) => (
                  <Link
                    key={`${column.title}-${item.label}`}
                    href={item.href}
                    className="text-sm font-bold text-slate-600 transition hover:text-slate-950"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center">
          <p className="text-xs font-semibold text-slate-400">
            © {year} Planify. Todos os direitos reservados.
          </p>
          <p className="text-xs font-semibold text-slate-400">
            Plataforma educacional para professores.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default PublicFooter;
