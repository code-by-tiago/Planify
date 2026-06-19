"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PlanifyBrand } from "@/components/pro/PlanifyBrand";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { usePlanifySession } from "@/hooks/usePlanifySession";
import { ppBtnPrimarySm } from "./theme";

const SOLUCOES_LINKS = [
  { label: "Planejamentos BNCC", href: "/planejamento-escolar-com-ia" },
  { label: "Materiais didáticos", href: "/gerador-de-atividades-com-ia" },
  { label: "Provas e avaliações", href: "/gerador-de-provas-com-ia" },
  { label: "Editor integrado", href: "/editor-de-documentos-para-professores" },
  { label: "Todas as ferramentas", href: "/ferramentas" },
];

const RECURSOS_LINKS = [
  { label: "Como funciona", href: "/#jornada" },
  { label: "Demonstração", href: "/#demo" },
  { label: "Comunidade docente", href: "/#comunidade" },
  { label: "Depoimentos", href: "/#depoimentos" },
];

function NavDropdown({
  label,
  links,
}: {
  label: string;
  links: { label: string; href: string }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <div ref={ref} className="pf-marketing-nav-dropdown relative hidden lg:block">
      <button
        type="button"
        className="pf-marketing-nav-link pf-marketing-nav-dropdown-trigger"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {label}
        <PlanifyIcon
          name="chevronDown"
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div className="pf-marketing-nav-dropdown-menu" role="menu">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              role="menuitem"
              className="pf-marketing-nav-dropdown-item"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const session = usePlanifySession();

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const showPainel = !session.loading && session.authenticated;

  return (
    <header
      className={`pf-marketing-nav pf-marketing-nav--light sticky top-0 z-50 pt-[env(safe-area-inset-top)] ${
        scrolled ? "is-scrolled" : ""
      }`}
    >
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-6 py-3 md:px-10 md:py-3.5">
        <PlanifyBrand href="/" hideTagline />

        <nav
          className="hidden flex-1 items-center justify-center gap-0.5 md:flex lg:gap-1"
          aria-label="Navegação principal"
        >
          <NavDropdown label="Soluções" links={SOLUCOES_LINKS} />
          <NavDropdown label="Recursos" links={RECURSOS_LINKS} />
          <Link href="/escolas" className="pf-marketing-nav-link hidden md:inline-flex">
            Para escolas
          </Link>
          <Link href="/planos" className="pf-marketing-nav-link hidden md:inline-flex">
            Preços
          </Link>
          <Link href="/contato" className="pf-marketing-nav-link hidden xl:inline-flex">
            Sobre
          </Link>
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          {showPainel ? (
            <Link href="/dashboard" className={`${ppBtnPrimarySm} whitespace-nowrap`}>
              Painel
            </Link>
          ) : (
            <>
              <Link href="/login" className="pf-marketing-btn pf-marketing-btn--ghost hidden sm:inline-flex">
                Entrar
              </Link>
              <Link href="/cadastro" className={`${ppBtnPrimarySm} whitespace-nowrap`}>
                Começar agora
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
