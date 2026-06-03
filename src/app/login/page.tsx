"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";

type Mode = "login" | "signup";

const benefits = [
  "Geradores com IA para planejamentos e materiais",
  "Alinhamento à BNCC e exportação em DOCX oficial",
  "Editor integrado, histórico e biblioteca premium",
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
        "Conta criada. Se o Supabase exigir confirmação, verifique seu e-mail antes de entrar."
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
    <main className="planify-ui3 min-h-screen">
      <PublicHeader />

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:py-16">
        {/* Coluna informativa */}
        <div className="hidden lg:block">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-indigo-700">
            <PlanifyIcon name="lock" className="h-4 w-4" />
            Acesso Planify
          </span>

          <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight text-slate-950 lg:text-5xl">
            Entre para acessar suas ferramentas pedagógicas.
          </h1>

          <p className="mt-5 max-w-lg text-base font-semibold leading-7 text-slate-600">
            Use o mesmo e-mail da sua assinatura para liberar os recursos premium
            do Planify.
          </p>

          <ul className="mt-8 grid gap-3">
            {benefits.map((item) => (
              <li
                key={item}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm"
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

        {/* Formulário */}
        <div className="rounded-[2.25rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-8">
          <div className="mb-6">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-700">
              Planify
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              {mode === "login" ? "Entrar na conta" : "Criar conta"}
            </h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              {mode === "login"
                ? "Acesse sua conta para continuar."
                : "Crie sua conta para acessar o Planify."}
            </p>
          </div>

          {premiumRequired ? (
            <div className="mb-6 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <PlanifyIcon
                name="alertCircle"
                className="h-5 w-5 shrink-0 text-amber-600"
              />
              <div>
                <p className="text-sm font-black text-amber-800">
                  Plano ativo necessário
                </p>
                <p className="mt-1 text-sm font-semibold leading-6 text-amber-700">
                  Faça login com um e-mail que possua assinatura ativa. O Planify
                  verifica o acesso premium automaticamente após a entrada.
                </p>
              </div>
            </div>
          ) : null}

          <div className="mb-5 grid grid-cols-2 rounded-2xl border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`rounded-xl px-4 py-3 text-sm font-black transition ${
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
              className={`rounded-xl px-4 py-3 text-sm font-black transition ${
                mode === "signup"
                  ? "bg-white text-slate-950 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Criar conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-black text-slate-700">
                E-mail
              </span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="professor@email.com"
                autoComplete="email"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-950 outline-none transition focus:border-slate-950 focus:bg-white"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-black text-slate-700">
                Senha
              </span>
              <input
                type="password"
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                placeholder="Mínimo 6 caracteres"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-950 outline-none transition focus:border-slate-950 focus:bg-white"
              />
            </label>

            {message ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
                {message}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white shadow-lg shadow-slate-200 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Aguarde..."
                : mode === "login"
                ? "Entrar"
                : "Criar conta"}
            </button>
          </form>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm font-bold text-slate-600">
              Ainda não tem um plano ativo?
            </p>
            <Link
              href="/planos"
              className="inline-flex items-center gap-1 text-sm font-black text-indigo-700 transition hover:text-indigo-900"
            >
              Ver planos
              <PlanifyIcon name="arrowRight" className="h-4 w-4" />
            </Link>
          </div>

          <p className="mt-5 text-center text-xs font-semibold leading-5 text-slate-500">
            O acesso às ferramentas premium depende de assinatura ativa ou
            permissão de administrador.
          </p>
        </div>
      </section>
    </main>
  );
}
