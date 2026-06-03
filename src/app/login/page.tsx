"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { TeachyLessonPreview } from "@/components/public/landing/TeachyLessonPreview";

type Mode = "login" | "signup";

const benefits = [
  "13 ferramentas com IA alinhadas à BNCC",
  "Construtor de aula completo em um fluxo",
  "Editor integrado, histórico e DOCX oficial",
];

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [redirect, setRedirect] = useState("/dashboard");
  const [premiumRequired, setPremiumRequired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      return null;
    }

    return createClient(url, anonKey);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirectParam = params.get("redirect");
    const premium = params.get("premium");

    if (redirectParam) {
      setRedirect(redirectParam);
    }

    setPremiumRequired(premium === "required");
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!supabase) {
      setMessage("Supabase não está configurado no frontend.");
      return;
    }

    if (!email.trim() || !senha.trim()) {
      setMessage("Informe e-mail e senha.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: senha,
        });

        if (error) {
          throw error;
        }

        router.push(redirect || "/dashboard");
        router.refresh();
        return;
      }

      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password: senha,
      });

      if (error) {
        throw error;
      }

      setMessage(
        "Conta criada. Se o Supabase exigir confirmação, verifique seu e-mail antes de entrar.",
      );
      setMode("login");
    } catch (error) {
      const text =
        error instanceof Error
          ? error.message
          : "Não foi possível concluir o acesso.";
      setMessage(text);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="planify-ui3 planify-public flex min-h-screen flex-col">
      <PublicHeader />

      <section className="mx-auto w-full max-w-7xl flex-1 px-5 py-10 sm:px-8 lg:py-14">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Coluna visual — estilo Teachy */}
          <div>
            <h1 className="text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl lg:text-[2.75rem]">
              {mode === "login" ? (
                <>
                  Bem-vindo de volta,{" "}
                  <span className="pl-gradient-text">professor.</span>
                </>
              ) : (
                <>
                  Comece grátis e crie materiais{" "}
                  <span className="pl-gradient-text">em minutos.</span>
                </>
              )}
            </h1>
            <p className="mt-4 max-w-lg text-base font-medium leading-7 text-slate-600">
              Use o e-mail da sua assinatura para liberar o painel, os geradores
              com IA e a exportação em DOCX oficial.
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

            <div className="mt-8 hidden lg:block">
              <TeachyLessonPreview />
            </div>
          </div>

          {/* Formulário */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-lg shadow-slate-200/40 sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">
              Acesso Planify
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              {mode === "login" ? "Entrar na conta" : "Criar conta"}
            </h2>
            <p className="mt-2 text-sm font-medium text-slate-500">
              {mode === "login"
                ? "Acesse o painel e continue de onde parou."
                : "Cadastre-se e escolha um plano para liberar o premium."}
            </p>

            {premiumRequired ? (
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
                    Entre com um e-mail que possua assinatura ativa ou{" "}
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
                className={`w-full rounded-full px-5 py-3.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  mode === "signup"
                    ? "pl-btn-brand w-full justify-center"
                    : "bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:opacity-95"
                }`}
              >
                {loading
                  ? "Aguarde..."
                  : mode === "login"
                    ? "Entrar"
                    : "Criar conta"}
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
