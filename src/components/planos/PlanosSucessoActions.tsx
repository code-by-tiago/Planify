"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { PlanosAtivarContaForm } from "@/components/planos/PlanosAtivarContaForm";
import { ppBtnPrimary, ppBtnSecondary } from "@/components/public/landing-professor-primeiro/theme";
import { getCurrentAccessToken } from "@/lib/auth/session-client";
import { syncPremiumAccessCookie } from "@/lib/auth/access-client";

type AccessState = "loading" | "premium" | "pending" | "activate";

type PlanosSucessoActionsProps = {
  sessionId?: string | null;
  needsEmailConfirm?: boolean;
};

export function PlanosSucessoActions({
  sessionId,
  needsEmailConfirm = false,
}: PlanosSucessoActionsProps) {
  const [state, setState] = useState<AccessState>("loading");
  const [checkoutEmail, setCheckoutEmail] = useState<string | null>(null);

  useEffect(() => {
    if (typeof sessionId !== "string" || !sessionId.trim()) {
      return;
    }

    const checkoutSessionId = sessionId.trim();
    let active = true;

    async function loadCheckoutEmail() {
      try {
        const res = await fetch(
          `/api/stripe/checkout-session?session_id=${encodeURIComponent(checkoutSessionId)}`,
          { cache: "no-store" },
        );
        const json = await res.json().catch(() => null);
        const email = json?.data?.email?.trim();

        if (active && email) {
          setCheckoutEmail(email);
        }
      } catch {
        // fallback: usuário informa e-mail no formulário
      }
    }

    void loadCheckoutEmail();

    return () => {
      active = false;
    };
  }, [sessionId]);

  useEffect(() => {
    let active = true;

    async function refreshAccess() {
      try {
        const token = await getCurrentAccessToken();
        if (!token) {
          if (active) setState("activate");
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
        if (active) setState("activate");
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

  if (needsEmailConfirm) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-6 text-left">
        <p className="text-sm font-bold text-amber-900">Confirme seu e-mail</p>
        <p className="mt-2 text-sm font-medium leading-6 text-amber-800">
          Enviamos um link de confirmação. Abra o e-mail, confirme e volte aqui
          para entrar com a senha que você criou. Seu plano já está pago.
        </p>
        <Link href="/login" className={`${ppBtnPrimary} mt-4 inline-flex`}>
          Ir para entrar
        </Link>
      </div>
    );
  }

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
          Pagamento recebido. Estamos liberando seu plano — aguarde alguns
          segundos ou ative sua conta abaixo.
        </p>
        <PlanosAtivarContaForm checkoutEmail={checkoutEmail} />
      </div>
    );
  }

  return <PlanosAtivarContaForm checkoutEmail={checkoutEmail} />;
}
