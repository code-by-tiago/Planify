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
    <div className="border-b border-indigo-100/60 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-5 py-3 sm:px-8">
        <BackButton />

        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700"
        >
          Início
        </Link>

        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-bold text-white transition hover:opacity-95"
        >
          Painel
        </Link>

        {pathname.startsWith("/admin") ? (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-800">
            Área administrativa
          </span>
        ) : null}
      </div>
    </div>
  );
}

export default PageBackNavigation;
