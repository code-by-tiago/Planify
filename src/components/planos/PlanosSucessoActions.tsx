"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { ppBtnPrimary, ppBtnSecondary } from "@/components/public/landing-professor-primeiro/theme";
import { getCurrentAccessToken } from "@/lib/auth/session-client";
import { syncPremiumAccessCookie } from "@/lib/auth/access-client";

type AccessState = "loading" | "premium" | "pending" | "login";

type PlanosSucessoActionsProps = {
  sessionId?: string | null;
};

function buildSignupHref(checkoutEmail: string | null): string {
  const params = new URLSearchParams({
    mode: "signup",
    redirect: "/dashboard",
  });

  if (checkoutEmail) {
    params.set("email", checkoutEmail);
  }

  return `/login?${params.toString()}`;
}

function buildLoginHref(checkoutEmail: string | null): string {
  const params = new URLSearchParams({ redirect: "/dashboard" });

  if (checkoutEmail) {
    params.set("email", checkoutEmail);
  }

  return `/login?${params.toString()}`;
}

export function PlanosSucessoActions({ sessionId }: PlanosSucessoActionsProps) {
  const [state, setState] = useState<AccessState>("loading");
  const [checkoutEmail, setCheckoutEmail] = useState<string | null>(null);

  const signupHref = useMemo(
    () => buildSignupHref(checkoutEmail),
    [checkoutEmail],
  );
  const loginHref = useMemo(() => buildLoginHref(checkoutEmail), [checkoutEmail]);

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
        // Mantém mensagem genérica se a consulta falhar.
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
          segundos.
          {checkoutEmail ? (
            <>
              {" "}
              Use o e-mail <strong className="text-slate-800">{checkoutEmail}</strong>{" "}
              ao entrar ou criar sua senha.
            </>
          ) : (
            " Entre na conta com o mesmo e-mail usado no pagamento."
          )}
        </p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/dashboard" className={ppBtnPrimary}>
            Tentar abrir o painel
          </Link>
          <Link href={loginHref} className={ppBtnSecondary}>
            Entrar na conta
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold leading-6 text-slate-600">
        {checkoutEmail ? (
          <>
            Crie sua senha com o e-mail{" "}
            <strong className="text-slate-800">{checkoutEmail}</strong> para
            liberar o acesso ao painel. Se já tiver conta, entre com esse mesmo
            e-mail.
          </>
        ) : (
          <>
            Crie sua senha com o <strong className="text-slate-800">mesmo e-mail</strong>{" "}
            usado no pagamento para liberar o acesso ao painel.
          </>
        )}
      </p>
      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        <Link href={signupHref} className={ppBtnPrimary}>
          Criar minha senha
          <PlanifyIcon name="arrowRight" className="h-4 w-4" />
        </Link>
        <Link href={loginHref} className={ppBtnSecondary}>
          Já tenho conta
        </Link>
      </div>
    </div>
  );
}
