"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import {
  signInAndSyncPremiumAccess,
  signUpAndGoToPlans,
} from "@/lib/auth/session-client";

type Mode = "login" | "signup";

const benefits = [
  "13 ferramentas com IA alinhadas à BNCC",
  "Construtor de aula completo em um fluxo",
  "Editor integrado, histórico e DOCX oficial",
];

function cleanRedirect(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  if (value === "/login" || value === "/sair") {
    return "/dashboard";
  }

  return value;
}

function forceNavigate(path: string) {
  window.location.href = path;
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [redirect, setRedirect] = useState("/dashboard");
  const [premiumRequired, setPremiumRequired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setRedirect(cleanRedirect(params.get("redirect")));
    setPremiumRequired(params.get("premium") === "required");

    if (params.get("cadastro") === "confirmar") {
      setMode("login");
      setMessage(
        "Confirme o e-mail que enviamos e depois entre com sua senha para escolher um plano.",
      );
    }
  }, []);

  const loginHint = useMemo(() => {
    if (premiumRequired) {
      return "Plano ativo necessário para a área solicitada.";
    }
    return null;
  }, [premiumRequired]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!email.trim() || !senha.trim()) {
      setMessage("Informe e-mail e senha.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        const result = await signUpAndGoToPlans({
          email: email.trim(),
          password: senha,
        });

        if (!result.success) {
          setMessage(result.message);
          return;
        }

        setMessage(result.message);

        if (result.needsEmailConfirmation) {
          setMode("login");
          return;
        }

        window.setTimeout(() => {
          forceNavigate(result.redirectTo || "/planos?cadastro=ok");
        }, 700);
        return;
      }

      const result = await signInAndSyncPremiumAccess({
        email: email.trim(),
        password: senha,
        redirectTo: redirect,
        requirePremium: false,
      });

      if (!result.success) {
        setMessage(result.message);
        return;
      }

      if (!result.premium) {
        setMessage(
          result.message ||
            "Sua conta existe, mas ainda não possui plano ativo. Administradores e proprietários entram automaticamente.",
        );
        window.setTimeout(() => {
          forceNavigate(result.redirectTo || "/planos?premium=required");
        }, 600);
        return;
      }

      setMessage("Login validado. Entrando...");
      router.refresh();
      window.setTimeout(() => {
        forceNavigate(result.redirectTo || "/dashboard");
      }, 350);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível concluir o acesso.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="planify-hud planify-ui3 planify-public planify-hud-landing flex min-h-screen flex-col">
      <PublicHeader />

      <section className="mx-auto w-full max-w-7xl flex-1 px-5 py-10 sm:px-8 lg:py-14">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <h1 className="pl-display text-3xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-4xl lg:text-[2.75rem]">
              {mode === "login" ? (
                <>
                  Bem-vindo de volta,{" "}
                  <span className="pl-hud-gradient-text">professor.</span>
                </>
              ) : (
                <>
                  Crie sua conta e escolha um{" "}
                  <span className="pl-hud-gradient-text">plano Planify.</span>
                </>
              )}
            </h1>
            <p className="mt-4 max-w-lg text-base font-medium leading-7 text-slate-600">
              {mode === "login" ? (
                <>
                  Use o e-mail da sua assinatura para liberar o painel, os
                  geradores com IA e a exportação em DOCX oficial. Contas de
                  administrador e proprietário têm acesso liberado após o login.
                </>
              ) : (
                <>
                  O cadastro é gratuito; o acesso aos geradores premium exige
                  um plano ativo (Pro ou Premium). Após criar a conta, você
                  escolhe o plano e libera créditos claros por ciclo.
                </>
              )}
            </p>

            <ul className="mt-6 grid gap-2.5 sm:max-w-md">
              {benefits.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm font-semibold text-slate-700"
                >
                  <PlanifyIcon
                    name="checkCircle"
                    className="h-5 w-5 shrink-0 text-emerald-600"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-md sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
              Acesso Planify
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              {mode === "login" ? "Entrar na conta" : "Criar conta"}
            </h2>
            <p className="mt-2 text-sm font-medium text-slate-500">
              {mode === "login"
                ? "Acesse o painel e continue de onde parou."
                : "Cadastro gratuito · plano necessário para usar os geradores IA."}
            </p>

            {loginHint ? (
              <div className="mt-5 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <PlanifyIcon
                  name="alertCircle"
                  className="h-5 w-5 shrink-0 text-amber-600"
                />
                <div>
                  <p className="text-sm font-black text-amber-800">
                    Plano ativo necessário
                  </p>
                  <p className="mt-1 text-sm font-medium leading-6 text-amber-700">
                    Entre com um e-mail que possua assinatura ativa, permissão
                    de administrador ou{" "}
                    <Link
                      href="/planos"
                      className="font-bold text-amber-900 underline"
                    >
                      escolha um plano
                    </Link>
                    .
                  </p>
                </div>
              </div>
            ) : null}

            <div className="mt-6 grid grid-cols-2 rounded-full border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`rounded-full px-4 py-2.5 text-sm font-bold transition ${
                  mode === "login"
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`rounded-full px-4 py-2.5 text-sm font-bold transition ${
                  mode === "signup"
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Criar conta
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  E-mail
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="professor@email.com"
                  autoComplete="email"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-950 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Senha
                </span>
                <input
                  type="password"
                  value={senha}
                  onChange={(event) => setSenha(event.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-950 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </label>

              {message ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                  {message}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className={`w-full rounded-xl px-5 py-3.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  mode === "signup"
                    ? "pl-btn-brand w-full justify-center"
                    : "pl-hud-btn bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:opacity-95"
                }`}
              >
                {loading
                  ? "Aguarde..."
                  : mode === "login"
                    ? "Entrar"
                    : "Criar conta e ver planos"}
              </button>
            </form>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3">
              <p className="text-sm font-semibold text-slate-600">
                Ainda não tem plano ativo?
              </p>
              <Link
                href="/planos"
                className="inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-800"
              >
                Ver planos
                <PlanifyIcon name="arrowRight" className="h-4 w-4" />
              </Link>
            </div>

            <p className="mt-5 text-center text-xs font-medium leading-5 text-slate-500">
              O acesso premium depende de assinatura ativa ou permissão de
              administrador.
            </p>
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
