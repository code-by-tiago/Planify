"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BackButton } from "./BackButton";

export function PageBackNavigation() {
  const pathname = usePathname();

  if (!pathname || pathname === "/") {
    return null;
  }

  return (
    <div className="border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-5 py-3 sm:px-8">
        <BackButton />

        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black text-slate-200 transition hover:-translate-y-0.5 hover:bg-white hover:text-slate-950"
        >
          Início
        </Link>

        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-300/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:-translate-y-0.5 hover:bg-cyan-300/20"
        >
          Painel
        </Link>

        {pathname.startsWith("/admin") ? (
          <span className="rounded-2xl border border-amber-300/25 bg-amber-300/10 px-5 py-3 text-sm font-black text-amber-100">
            Área administrativa
          </span>
        ) : null}
      </div>
    </div>
  );
}

export default PageBackNavigation;
