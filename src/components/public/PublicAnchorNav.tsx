"use client";

import Link from "next/link";

const links = [
  { href: "#inicio", label: "Início" },
  { href: "#painel", label: "Painel" },
  { href: "#ferramentas", label: "Ferramentas" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#planos", label: "Planos" },
  { href: "#faq", label: "FAQ" },
];

export function PublicAnchorNav() {
  return (
    <nav
      aria-label="Seções da página"
      className="sticky top-[57px] z-40 border-b border-indigo-100/80 bg-white/90 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-5 py-2 sm:px-8">
        {links.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold text-violet-700 transition hover:bg-violet-50 hover:text-violet-950 sm:text-sm"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
