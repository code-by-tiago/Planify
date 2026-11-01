"use client";

import Link from "next/link";
import { useState } from "react";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { signInWithGoogle } from "@/lib/auth/session-client";
import { ppBtnPrimary, ppBtnSecondary } from "./theme";

export function LandingHeroAccess() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    setLoading(true);
    setError(null);

    try {
      await signInWithGoogle("/dashboard");
    } catch (signInError) {
      setLoading(false);
      setError(
        signInError instanceof Error
          ? signInError.message
          : "Não foi possível iniciar o acesso com o Google.",
      );
    }
  }

  return (
    <div className="mx-auto mt-10 max-w-xl rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-[0_18px_55px_rgba(10,25,47,0.08)] sm:p-7">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F0F9FA] text-[#0A192F]">
          <PlanifyIcon name="lock" className="h-5 w-5 text-[#26C6DA]" />
        </span>
        <div>
          <p className="font-[family-name:var(--font-display)] text-lg font-extrabold text-[#0A192F]">
            Acesso seguro para professores
          </p>
          <p className="mt-1 text-sm font-medium leading-6 text-slate-600">
            Entre com sua conta Google para conhecer o painel. As ferramentas de IA e
            exportações ficam disponíveis somente para assinantes ou escolas licenciadas.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => void handleGoogleSignIn()}
        disabled={loading}
        className={`${ppBtnPrimary} mt-6 w-full justify-center disabled:cursor-wait disabled:opacity-70`}
      >
        <PlanifyIcon name="spark" className="h-4 w-4" />
        {loading ? "Abrindo acesso Google..." : "Entrar com Google"}
      </button>

      <Link href="/planos" className={`${ppBtnSecondary} mt-3 w-full justify-center`}>
        Ver planos e assinatura
        <PlanifyIcon name="arrowRight" className="h-4 w-4" />
      </Link>

      {error ? (
        <p role="alert" className="mt-4 text-center text-sm font-semibold text-red-600">
          {error}
        </p>
      ) : null}

      <p className="mt-4 text-center text-xs font-medium leading-5 text-slate-500">
        Ao continuar, você autoriza o login Google conforme a{" "}
        <Link href="/privacidade" className="font-bold text-[#0A6B83] underline">
          Política de Privacidade
        </Link>
        .
      </p>
    </div>
  );
}
