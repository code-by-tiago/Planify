"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { ppBtnPrimary, ppBtnSecondary } from "@/components/public/landing-professor-primeiro/theme";
import { getCurrentAccessToken } from "@/lib/auth/session-client";
import { syncPremiumAccessCookie } from "@/lib/auth/access-client";

type AccessState = "loading" | "premium" | "pending" | "login";

export function PlanosSucessoActions() {
  const [state, setState] = useState<AccessState>("loading");

  useEffect(() => {
    let active = true;

    async function refreshAccess() {
      try {
        const token = await getCurrentAccessToken();
        if (!token) {
          if (active) setState("login");
          return;
        }

        await syncPremiumAccessCookie(token);

        const res = await fetch("/api/access/status", {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json().catch(() => null);

        if (data?.premium) {
          if (active) setState("premium");
          return;
        }

        if (active) setState("pending");
      } catch {
        if (active) setState("login");
      }
    }

    void refreshAccess();

    const timer = window.setInterval(() => {
      void refreshAccess();
    }, 4000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  if (state === "loading") {
    return (
      <p className="text-sm font-semibold text-slate-500">
        Validando seu acesso premium…
      </p>
    );
  }

  if (state === "premium") {
    return (
      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/dashboard" className={ppBtnPrimary}>
          Ir ao painel
          <PlanifyIcon name="arrowRight" className="h-4 w-4" />
        </Link>
        <Link href="/" className={ppBtnSecondary}>
          Página inicial
        </Link>
      </div>
    );
  }

  if (state === "pending") {
    return (
      <div className="space-y-4">
        <p className="text-sm font-semibold leading-6 text-slate-600">
          Pagamento recebido. Estamos liberando seu plano — isso leva alguns
          segundos. Você já pode tentar abrir o painel; se ainda não liberar,
          entre na conta e aguarde a confirmação.
        </p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/dashboard" className={ppBtnPrimary}>
            Tentar abrir o painel
          </Link>
          <Link href="/login" className={ppBtnSecondary}>
            Entrar na conta
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center gap-3 sm:flex-row">
      <Link href="/login" className={ppBtnPrimary}>
        Entrar na conta
      </Link>
      <Link href="/planos" className={ppBtnSecondary}>
        Ver planos
      </Link>
    </div>
  );
}
