"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { PlanifyBrand } from "@/components/pro/PlanifyBrand";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import {
  buildLoginRedirect,
  buildPlansRedirect,
  getCurrentPathWithSearch,
} from "@/lib/auth/premium-gate";

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
  const [status, setStatus] = useState<GateStatus>(initialStatus);
  const [redirectPath, setRedirectPath] = useState("/dashboard");

  useEffect(() => {
    setRedirectPath(getCurrentPathWithSearch("/dashboard"));
  }, []);

  useEffect(() => {
    let active = true;

    async function loadAccess() {
      try {
        const response = await fetch("/api/access/status", {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        });

        const data = (await response.json().catch(() => null)) as
          | {
              authenticated?: boolean;
              premium?: boolean;
              email?: string;
              message?: string;
            }
          | null;

        if (!active) return;

        setStatus({
          loading: false,
          authenticated: Boolean(data?.authenticated),
          premium: Boolean(data?.premium),
          email: data?.email || "",
          message:
            data?.message ||
            (data?.premium
              ? "Acesso premium confirmado."
              : data?.authenticated
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
        <div className="planify-ui3 w-full max-w-sm rounded-[2rem] border border-fuchsia-100/70 bg-white p-8 text-center shadow-xl shadow-violet-100/50">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
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
      <main className="planify-ui3 flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        <section className="flex min-h-0 flex-1 items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-[2rem] border border-fuchsia-100/70 bg-white p-8 text-center shadow-xl shadow-violet-100/40">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
              <PlanifyIcon name="lock" className="h-7 w-7" />
            </div>
            <h1 className="mt-6 text-3xl font-black tracking-tight text-violet-950 sm:text-4xl">
              Acesso restrito
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm font-semibold leading-6 text-violet-500/90">
              Para usar {featureName}, entre com o e-mail cadastrado no Planify.
              Se o plano estiver ativo, o acesso será liberado automaticamente.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                href={buildLoginRedirect(redirectPath)}
                className="pl-btn-primary"
              >
                Entrar
              </Link>
              <Link
                href="/planos"
                className="rounded-2xl border border-fuchsia-100 bg-white px-5 py-3 text-sm font-black text-violet-700 transition hover:border-fuchsia-200"
              >
                Ver planos
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (!status.premium) {
    return (
      <main className="planify-ui3 flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        <section className="flex min-h-0 flex-1 items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-[2rem] border border-fuchsia-100/70 bg-white p-8 text-center shadow-xl shadow-violet-100/40">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-100 to-rose-100 text-violet-700">
              <PlanifyIcon name="plans" className="h-7 w-7" />
            </div>
            <h1 className="mt-6 text-3xl font-black tracking-tight text-violet-950 sm:text-4xl">
              Plano premium necessário
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm font-semibold leading-6 text-violet-500/90">
              O e-mail <strong>{status.email}</strong> está logado, mas ainda
              não possui plano ativo para acessar {featureName}.
            </p>
            <p className="mx-auto mt-2 max-w-md text-xs font-semibold text-violet-400">
              {status.message}
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                href={buildPlansRedirect(redirectPath)}
                className="pl-btn-primary"
              >
                Ativar plano
              </Link>
              <Link
                href="/dashboard"
                className="rounded-2xl border border-fuchsia-100 bg-white px-5 py-3 text-sm font-black text-violet-700 transition hover:border-fuchsia-200"
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
