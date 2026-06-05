"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { PlanifyBrand } from "@/components/pro/PlanifyBrand";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";

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

  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      return null;
    }

    return createClient(url, anonKey);
  }, []);

  useEffect(() => {
    setRedirectPath(
      `${window.location.pathname}${window.location.search || ""}`
    );
  }, []);

  useEffect(() => {
    let active = true;

    async function loadAccess() {
      try {
        if (!supabase) {
          if (!active) return;
          setStatus({
            loading: false,
            authenticated: false,
            premium: false,
            email: "",
            message:
              "Configuração de acesso indisponível. Verifique as variáveis públicas do Supabase.",
          });
          return;
        }

        const sessionResult = await supabase.auth.getSession();
        const session = sessionResult.data.session;

        if (!session) {
          if (!active) return;
          setStatus({
            loading: false,
            authenticated: false,
            premium: false,
            email: "",
            message:
              "Entre com o e-mail da sua conta Planify para continuar.",
          });
          return;
        }

        const response = await fetch("/api/premium/status", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          cache: "no-store",
        });

        const data = (await response.json().catch(() => null)) as
          | {
              premium?: boolean;
              email?: string;
              message?: string;
            }
          | null;

        if (!active) return;

        setStatus({
          loading: false,
          authenticated: true,
          premium: Boolean(data?.premium),
          email: data?.email || session.user.email || "",
          message:
            data?.message ||
            (data?.premium
              ? "Acesso premium confirmado."
              : "Este e-mail ainda não possui plano ativo."),
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
  }, [supabase]);

  if (status.loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f7fb] p-4">
        <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-7 text-center shadow-xl shadow-slate-200">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-white">
            <PlanifyIcon name="lock" className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-2xl font-black text-slate-950">
            Verificando acesso
          </h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            {status.message}
          </p>
          <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-slate-950" />
          </div>
        </div>
      </main>
    );
  }

  if (!status.authenticated) {
    return (
      <main className="min-h-screen bg-[#f6f7fb] text-slate-950">
        <header className="border-b border-slate-200 bg-white px-5 py-4">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <PlanifyBrand href="/" />
            <Link
              href="/planos"
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 transition hover:border-slate-950"
            >
              Planos
            </Link>
          </div>
        </header>

        <section className="flex min-h-[calc(100vh-80px)] items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-950 text-white">
              <PlanifyIcon name="lock" className="h-7 w-7" />
            </div>
            <h1 className="mt-6 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Acesso restrito
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm font-semibold leading-6 text-slate-600">
              Para usar {featureName}, entre com o e-mail cadastrado no Planify.
              Se o plano estiver ativo, o acesso será liberado automaticamente.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                href={`/login?premium=required&redirect=${encodeURIComponent(
                  redirectPath
                )}`}
                className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-200 transition hover:-translate-y-0.5"
              >
                Entrar
              </Link>
              <Link
                href="/planos"
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-slate-950"
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
      <main className="min-h-screen bg-[#f6f7fb] text-slate-950">
        <header className="border-b border-slate-200 bg-white px-5 py-4">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <PlanifyBrand href="/dashboard" />
            <Link
              href="/dashboard"
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 transition hover:border-slate-950"
            >
              Voltar ao painel
            </Link>
          </div>
        </header>

        <section className="flex min-h-[calc(100vh-80px)] items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-700">
              <PlanifyIcon name="plans" className="h-7 w-7" />
            </div>
            <h1 className="mt-6 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Plano premium necessário
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm font-semibold leading-6 text-slate-600">
              O e-mail <strong>{status.email}</strong> está logado, mas ainda
              não possui plano ativo para acessar {featureName}.
            </p>
            <p className="mx-auto mt-2 max-w-md text-xs font-semibold text-slate-400">
              {status.message}
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                href="/planos"
                className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-200 transition hover:-translate-y-0.5"
              >
                Ativar plano
              </Link>
              <Link
                href="/dashboard"
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-slate-950"
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
