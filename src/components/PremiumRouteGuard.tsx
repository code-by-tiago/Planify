"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type AccessStatus = {
  authenticated: boolean;
  premium: boolean;
  role?: string;
  email?: string;
};

const protectedPrefixes = [
  "/dashboard",
  "/planejamentos",
  "/materiais",
  "/editor",
  "/historico",
  "/biblioteca",
  "/marketplace",
];

function isProtectedPath(pathname: string) {
  if (
    pathname === "/" ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/planos") ||
    pathname.startsWith("/contato") ||
    pathname.startsWith("/sair") ||
    pathname.startsWith("/api")
  ) {
    return false;
  }

  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function makeLoginUrl(pathname: string) {
  let current = pathname;

  if (typeof window !== "undefined") {
    current = `${window.location.pathname}${window.location.search || ""}`;
  }

  return `/login?premium=required&redirect=${encodeURIComponent(current)}`;
}

export function PremiumRouteGuard() {
  const pathname = usePathname();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!pathname || !isProtectedPath(pathname)) {
      return;
    }

    let active = true;

    async function checkAccess() {
      setChecking(true);

      try {
        const response = await fetch("/api/access/status", {
          cache: "no-store",
          credentials: "include",
        });

        const data = (await response.json()) as AccessStatus;

        if (!active) return;

        if (!response.ok || !data.authenticated || !data.premium) {
          window.location.href = makeLoginUrl(pathname);
          return;
        }
      } catch {
        if (active) {
          window.location.href = makeLoginUrl(pathname);
        }
      } finally {
        if (active) {
          setChecking(false);
        }
      }
    }

    checkAccess();

    return () => {
      active = false;
    };
  }, [pathname]);

  if (!pathname || !isProtectedPath(pathname) || !checking) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-3 border-b border-white/10 bg-white/5 px-5 py-3 text-center">
      <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      <span className="text-sm font-bold text-slate-300">
        Validando acesso...
      </span>
    </div>
  );
}

export default PremiumRouteGuard;
