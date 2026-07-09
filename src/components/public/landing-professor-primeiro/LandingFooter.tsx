import Link from "next/link";
import { OwnerFooterLink } from "@/components/OwnerFooterLink";
import { PlanifyBrand } from "@/components/pro/PlanifyBrand";
import { INSTAGRAM_URL, InstagramIcon } from "./InstagramIcon";

const FOOTER_LINKS = [
  { href: "/escolas", label: "Para escolas" },
  { href: "/testar-planejamento", label: "Teste grátis" },
  { href: "/inclusao", label: "Inclusão" },
  { href: "/pei", label: "PEI" },
  { href: "/correcao", label: "Corretor IA" },
];

export function LandingFooter() {
  return (
    <footer
      data-pp-dark
      className="bg-[#0A192F] px-5 py-12 pb-[max(3rem,env(safe-area-inset-bottom))] !text-white sm:px-8"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <PlanifyBrand href="/" hideTagline dark />
          <p className="mt-4 max-w-xs text-sm font-medium leading-7 !text-white/90">
            Planify IA Educacional: planejamentos, atividades, provas e documentos editáveis
            alinhados à BNCC.
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          {FOOTER_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-semibold !text-white transition hover:!text-[#26C6DA]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={INSTAGRAM_URL}
            aria-label="Instagram do Planify"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/95 transition hover:border-[#E1306C]/50 hover:bg-white"
          >
            <InstagramIcon className="h-5 w-5" variant="brand" />
          </a>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-7xl border-t border-white/20 pt-6">
        <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <p className="text-xs font-medium !text-white/80">
            © 2026 Planify · Educação básica · BNCC · Brasil
          </p>
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <Link
              href="/privacidade"
              className="text-xs font-medium !text-white/80 transition hover:!text-[#26C6DA]"
            >
              Privacidade
            </Link>
            <Link
              href="/termos"
              className="text-xs font-medium !text-white/80 transition hover:!text-[#26C6DA]"
            >
              Termos de uso
            </Link>
            <OwnerFooterLink className="!text-xs !font-medium !text-white/80 hover:!text-[#26C6DA]" />
          </nav>
        </div>
      </div>
    </footer>
  );
}
