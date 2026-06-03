"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { PlanifyBrand } from "@/components/pro/PlanifyBrand";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";

type Mode = "login" | "signup";

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
    <main className="min-h-screen bg-[#f6f7fb] text-slate-950">
      <header className="border-b border-slate-200 bg-white px-5 py-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <PlanifyBrand href="/" />

          <nav className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 transition hover:border-slate-950"
            >
              Início
            </Link>
            <Link
              href="/planos"
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 transition hover:border-slate-950"
            >
              Planos
            </Link>
            <Link
              href="/dashboard"
              className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white shadow-lg shadow-slate-200"
            >
              Painel
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-80px)] max-w-6xl items-center gap-8 px-5 py-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="hidden lg:block">
          <div className="inline-flex items-center gap-2 rounded-2xl bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-blue-700">
            <PlanifyIcon name="lock" className="h-4 w-4" />
            Acesso Planify
          </div>
          <h1 className="mt-5 max-w-xl text-5xl font-black leading-tight tracking-tight text-slate-950">
            Entre para acessar suas ferramentas pedagógicas.
          </h1>
          <p className="mt-4 max-w-lg text-base font-semibold leading-7 text-slate-600">
            Use o mesmo e-mail da assinatura para liberar recursos premium,
            materiais, planejamentos, editor e histórico.
          </p>

          {premiumRequired ? (
            <div className="mt-6 rounded-[1.5rem] border border-blue-100 bg-blue-50 p-4">
              <p className="text-sm font-black text-blue-800">
                Login necessário para continuar
              </p>
              <p className="mt-1 text-sm font-semibold leading-6 text-blue-700">
                Após entrar, o Planify verificará automaticamente se o e-mail
                possui plano ativo.
              </p>
            </div>
          ) : null}
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200 sm:p-8">
          <div className="mb-6">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
              Planify
            </p>
            <h2 className="mt-2 text-4xl font-black tracking-tight text-slate-950">
              {mode === "login" ? "Entrar na conta" : "Criar conta"}
            </h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              {mode === "login"
                ? "Acesse sua conta para continuar."
                : "Crie sua conta para acessar o Planify."}
            </p>
          </div>

          <div className="mb-5 grid grid-cols-2 rounded-2xl border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`rounded-xl px-4 py-3 text-sm font-black transition ${
                mode === "login"
                  ? "bg-white text-slate-950 shadow-sm"
                  : "text-slate-500"
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
                  : "text-slate-500"
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
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-semibold outline-none transition focus:border-slate-950"
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
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-semibold outline-none transition focus:border-slate-950"
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

          <p className="mt-5 text-center text-xs font-semibold leading-5 text-slate-500">
            O acesso às ferramentas premium depende de assinatura ativa ou
            permissão de administrador.
          </p>
        </div>
      </section>
    </main>
  );
}
