"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const adminLinks = [
  { href: "/admin", label: "Painel", match: (path: string) => path === "/admin" },
  {
    href: "/admin/corpus",
    label: "Garimpo RAG",
    match: (path: string) => path.startsWith("/admin/corpus"),
  },
  {
    href: "/admin/biblioteca",
    label: "Biblioteca",
    match: (path: string) => path.startsWith("/admin/biblioteca"),
  },
  {
    href: "/admin#qualidade-ia",
    label: "Qualidade IA",
    match: () => false,
  },
] as const;

type AdminSidebarLinksProps = {
  className?: string;
  orientation?: "horizontal" | "vertical";
};

export function AdminSidebarLinks({
  className = "",
  orientation = "horizontal",
}: AdminSidebarLinksProps) {
  const pathname = usePathname();

  return (
    <nav
      className={`flex gap-1 ${
        orientation === "vertical" ? "flex-col" : "flex-wrap"
      } ${className}`}
      aria-label="Navegação admin"
    >
      {adminLinks.map((link) => {
        const active = link.match(pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              active
                ? "bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/30"
                : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
