import Link from "next/link";
import type { ReactNode } from "react";

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
};

export function ButtonLink({ href, children, variant = "primary", className = "" }: ButtonLinkProps) {
  const variants = {
    primary:
      "bg-white text-slate-950 shadow-2xl shadow-white/10 hover:-translate-y-1 hover:bg-cyan-100",
    secondary:
      "border border-white/10 bg-white/5 text-white hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-cyan-300/10",
    ghost:
      "text-cyan-200 hover:text-white",
  };

  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-2xl px-6 py-3.5 text-sm font-black transition ${variants[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}