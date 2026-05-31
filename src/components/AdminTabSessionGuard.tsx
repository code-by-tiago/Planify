"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

type AdminTabSessionGuardProps = {
  children: ReactNode;
};

export function AdminTabSessionGuard({ children }: AdminTabSessionGuardProps) {
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unlocked =
      typeof window !== "undefined" &&
      window.sessionStorage.getItem("planify_admin_tab_unlocked") === "true";

    if (unlocked) {
      setAllowed(true);
      setChecking(false);
      return;
    }

    async function lockAdmin() {
      try {
        await fetch("/api/admin/session", {
          method: "DELETE",
          credentials: "include",
          cache: "no-store",
        });
      } catch {
        // Silencioso: a próxima renderização já volta ao gate.
      } finally {
        setAllowed(false);
        setChecking(false);

        window.setTimeout(() => {
          window.location.href = "/admin";
        }, 250);
      }
    }

    lockAdmin();
  }, []);

  if (checking) {
    return (
      <section className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
        <div className="rounded-[2rem] border border-cyan-300/20 bg-cyan-300/10 p-6 text-sm font-bold text-cyan-100">
          Validando sessão administrativa da aba...
        </div>
      </section>
    );
  }

  if (!allowed) {
    return (
      <section className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
        <div className="rounded-[2rem] border border-amber-300/20 bg-amber-300/10 p-6 text-sm font-bold text-amber-100">
          Sessão administrativa encerrada. Redirecionando para login admin...
        </div>
      </section>
    );
  }

  return <>{children}</>;
}

export default AdminTabSessionGuard;
