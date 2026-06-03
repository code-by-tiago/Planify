"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

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
  message: "Verificando acesso premium...",
};

export default function PremiumAccessGate({
  children,
  featureName = "esta ferramenta",
}: PremiumAccessGateProps) {
  const [status, setStatus] = useState<GateStatus>(initialStatus);

  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      return null;
    }

    return createClient(url, anonKey);
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
              "Faça login com o e-mail usado na assinatura para acessar esta ferramenta.",
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
              : "Este e-mail ainda não possui plano premium ativo."),
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
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 text-center shadow-xl shadow-slate-200">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-2xl text-white">
            🔐
          </div>
          <h1 className="mt-4 text-2xl font-black text-slate-950">
            Verificando acesso
          </h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            {status.message}
          </p>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-slate-950" />
          </div>
        </div>
      </main>
    );
  }

  if (!status.authenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,#eef6ff_0,#f8fafc_42%,#ffffff_100%)] p-4">
        <div className="w-full max-w-xl rounded-[2.4rem] border border-white bg-white p-8 text-center shadow-2xl shadow-slate-200">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-950 text-3xl text-white">
            🔐
          </div>
          <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950">
            Login necessário
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm font-medium leading-6 text-slate-600">
            Para usar {featureName}, entre com o e-mail da sua conta Planify.
            Se o e-mail tiver plano ativo, o acesso será liberado
            automaticamente.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/login"
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-300 transition hover:-translate-y-0.5"
            >
              Entrar na conta
            </Link>
            <Link
              href="/planos"
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-slate-950"
            >
              Ver planos
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!status.premium) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,#fff7ed_0,#f8fafc_45%,#ffffff_100%)] p-4">
        <div className="w-full max-w-xl rounded-[2.4rem] border border-white bg-white p-8 text-center shadow-2xl shadow-slate-200">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-100 text-3xl">
            💎
          </div>
          <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950">
            Plano premium necessário
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm font-medium leading-6 text-slate-600">
            O e-mail <strong>{status.email}</strong> está logado, mas não possui
            assinatura premium ativa para acessar {featureName}.
          </p>
          <p className="mx-auto mt-2 max-w-md text-xs font-semibold text-slate-400">
            {status.message}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/planos"
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-300 transition hover:-translate-y-0.5"
            >
              Ativar plano
            </Link>
            <Link
              href="/dashboard"
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-slate-950"
            >
              Voltar ao Studio
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
