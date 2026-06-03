import Link from "next/link";
import type { ReactNode } from "react";

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
};

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className = "",
}: ButtonLinkProps) {
  const variants = {
    primary:
      "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md hover:opacity-95",
    secondary:
      "border border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:text-indigo-700",
    ghost: "text-indigo-600 hover:text-indigo-800",
  };

  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-bold transition ${variants[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}
