"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { isAuthOnlyRoute } from "@/config/protected-routes";
import {
  buildLoginRedirect,
  buildPlansRedirect,
  getCurrentPathWithSearch,
} from "@/lib/auth/premium-gate";
import { resolveClientPlanifyAccess } from "@/lib/auth/resolve-client-access";

type GateStatus = {
  loading: boolean;
  authenticated: boolean;
  premium: boolean;
  email: string;
  message: string;
};

type PremiumAccessGateProps = {
  children: ReactNode;
  featureName?: string;
};

const initialStatus: GateStatus = {
  loading: true,
  authenticated: false,
  premium: false,
  email: "",
  message: "Verificando acesso...",
};

export default function PremiumAccessGate({
  children,
  featureName = "esta ferramenta",
}: PremiumAccessGateProps) {
  const pathname = usePathname();
  const authOnlyRoute = isAuthOnlyRoute(pathname || "");
  const [status, setStatus] = useState<GateStatus>(initialStatus);
  const [redirectPath, setRedirectPath] = useState("/dashboard");

  useEffect(() => {
    setRedirectPath(getCurrentPathWithSearch("/dashboard"));
  }, []);

  useEffect(() => {
    let active = true;

    async function loadAccess() {
      try {
        let snapshot = await resolveClientPlanifyAccess();

        if (!active) return;

        for (
          let attempt = 0;
          attempt < 3 && !snapshot.authenticated && !snapshot.token;
          attempt += 1
        ) {
          await new Promise((resolve) => setTimeout(resolve, 700 * (attempt + 1)));
          if (!active) return;
          snapshot = await resolveClientPlanifyAccess();
        }

        if (!active) return;

        setStatus({
          loading: false,
          authenticated: snapshot.authenticated,
          premium: snapshot.premium,
          email: snapshot.email || "",
          message:
            snapshot.message ||
            (snapshot.premium
              ? "Acesso premium confirmado."
              : snapshot.authenticated
                ? "Este e-mail ainda não possui plano ativo."
                : "Entre com o e-mail da sua conta Planify para continuar."),
        });
      } catch {
        if (!active) return;
        setStatus({
          loading: false,
          authenticated: false,
          premium: false,
          email: "",
          message:
            "Não foi possível verificar o acesso. Tente entrar novamente.",
        });
      }
    }

    loadAccess();

    return () => {
      active = false;
    };
  }, []);

  if (status.loading) {
    return (
      <main className="flex h-full min-h-[280px] flex-1 items-center justify-center p-4">
        <div className="planify-hud planify-ui3 planify-hud-app w-full max-w-sm rounded-2xl border border-cyan-400/20 bg-white/90 p-8 text-center shadow-lg backdrop-blur-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 text-white">
            <PlanifyIcon name="lock" className="h-6 w-6" />
          </div>
          <h2 className="mt-5 text-xl font-black text-slate-950">
            Verificando acesso
          </h2>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            {status.message}
          </p>
          <div className="mt-6 flex items-center justify-center gap-2">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-slate-950" />
            <span className="text-xs font-bold text-slate-400">Aguarde</span>
          </div>
        </div>
      </main>
    );
  }

  if (!status.authenticated) {
    return (
      <main className="planify-hud planify-ui3 planify-hud-app flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        <section className="flex min-h-0 flex-1 items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl border border-cyan-400/20 bg-white/90 p-8 text-center shadow-lg backdrop-blur-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-blue-500 text-white">
              <PlanifyIcon name="lock" className="h-7 w-7" />
            </div>
            <h1 className="mt-4 text-sm font-semibold tracking-tight text-slate-900 sm:text-base">
              Acesso restrito
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm font-semibold leading-6 text-slate-600">
              Para usar {featureName}, entre com o e-mail cadastrado no Planify.
              Se o plano estiver ativo, o acesso será liberado automaticamente.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                href={buildLoginRedirect(redirectPath)}
                className="pl-hud-btn rounded-xl px-6 py-3 text-sm font-semibold"
              >
                Entrar
              </Link>
              <Link
                href="/planos"
                className="pl-hud-btn rounded-full px-6 py-3 text-sm font-black text-slate-900"
              >
                Ver planos
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (!status.premium && !authOnlyRoute) {
    return (
      <main className="planify-hud planify-ui3 planify-hud-app flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        <section className="flex min-h-0 flex-1 items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl border border-cyan-400/20 bg-white/90 p-8 text-center shadow-lg backdrop-blur-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-700">
              <PlanifyIcon name="plans" className="h-7 w-7" />
            </div>
            <h1 className="mt-4 text-sm font-semibold tracking-tight text-slate-900 sm:text-base">
              Plano premium necessário
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm font-semibold leading-6 text-slate-600">
              O e-mail <strong>{status.email}</strong> está logado, mas ainda
              não possui plano ativo para acessar {featureName}.
            </p>
            <p className="mx-auto mt-2 max-w-md text-xs font-semibold text-slate-500">
              {status.message}
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                href={buildPlansRedirect(redirectPath)}
                className="pl-hud-btn rounded-full px-6 py-3 text-sm font-black text-slate-900"
              >
                Ativar plano
              </Link>
              <Link
                href="/dashboard"
                className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-800 transition hover:bg-slate-50"
              >
                Voltar ao painel
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
