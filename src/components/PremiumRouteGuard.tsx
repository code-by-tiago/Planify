"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  buildLoginRedirect,
  buildPlansRedirect,
  getCurrentPathWithSearch,
} from "@/lib/auth/premium-gate";
import { resolveClientPlanifyAccess } from "@/lib/auth/resolve-client-access";

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
        let snapshot = await resolveClientPlanifyAccess();

        if (!active) return;

        if (!snapshot.authenticated && !snapshot.token) {
          await new Promise((resolve) => setTimeout(resolve, 800));
          if (!active) return;
          snapshot = await resolveClientPlanifyAccess();
        }

        // #region agent log
        fetch("http://127.0.0.1:7616/ingest/e1530077-9aac-4460-b700-4c831c23c281", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "3ed578",
          },
          body: JSON.stringify({
            sessionId: "3ed578",
            runId: "auth-session-debug",
            hypothesisId: "H3-H4",
            location: "PremiumRouteGuard.tsx:checkAccess",
            message: "client route guard result",
            data: {
              pathname,
              authenticated: snapshot.authenticated,
              premium: snapshot.premium,
              hasToken: Boolean(snapshot.token),
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion

        if (!active) return;

        const currentPath = getCurrentPathWithSearch(pathname);

        if (!snapshot.authenticated) {
          window.location.href = buildLoginRedirect(currentPath);
          return;
        }

        if (!snapshot.premium) {
          window.location.href = buildPlansRedirect(currentPath);
          return;
        }
      } catch {
        if (active) {
          const currentPath = getCurrentPathWithSearch(pathname);
          window.location.href = buildLoginRedirect(currentPath);
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
    <div className="flex items-center justify-center gap-3 border-b border-indigo-100 bg-indigo-50/90 px-5 py-3 text-center">
      <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
      <span className="text-sm font-bold text-indigo-800">
        Validando acesso...
      </span>
    </div>
  );
}

export default PremiumRouteGuard;
