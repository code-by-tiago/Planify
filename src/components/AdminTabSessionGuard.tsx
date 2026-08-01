"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

type AdminTabSessionGuardProps = {
  children: ReactNode;
};

function adminLoginRedirect(): string {
  const path =
    typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search || ""}`
      : "/admin";
  return `/login?mode=admin&redirect=${encodeURIComponent(path)}`;
}

export function AdminTabSessionGuard({ children }: AdminTabSessionGuardProps) {
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;

    async function validateAdminSession() {
      const tabUnlocked =
        typeof window !== "undefined" &&
        window.sessionStorage.getItem("planify_admin_tab_unlocked") === "true";

      if (tabUnlocked) {
        if (active) {
          setAllowed(true);
          setChecking(false);
        }
        return;
      }

      try {
        const response = await fetch("/api/admin/status", {
          credentials: "include",
          cache: "no-store",
        });
        const data = (await response.json().catch(() => null)) as {
          isOwner?: boolean;
          authenticated?: boolean;
        } | null;

        if (active && data?.isOwner) {
          window.sessionStorage.setItem("planify_admin_tab_unlocked", "true");
          setAllowed(true);
          setChecking(false);
          return;
        }
      } catch {
        // segue para fluxo de login admin
      }

      try {
        await fetch("/api/admin/session", {
          method: "DELETE",
          credentials: "include",
          cache: "no-store",
        });
      } catch {
        // silencioso
      }

      if (!active) return;

      setAllowed(false);
      setChecking(false);
      window.location.href = adminLoginRedirect();
    }

    void validateAdminSession();

    return () => {
      active = false;
    };
  }, []);

  if (checking) {
    return (
      <section className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
        <div className="rounded-[2rem] border border-cyan-300/20 bg-cyan-300/10 p-6 text-sm font-bold text-cyan-800">
          Validando sessão administrativa...
        </div>
      </section>
    );
  }

  if (!allowed) {
    return (
      <section className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
        <div className="rounded-[2rem] border border-amber-300/20 bg-amber-300/10 p-6 text-sm font-bold text-amber-900">
          Redirecionando para login do proprietário...
        </div>
      </section>
    );
  }

  return <>{children}</>;
}

export default AdminTabSessionGuard;
