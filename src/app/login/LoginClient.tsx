"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import {
  createAdminSession,
  signInAndSyncPremiumAccess,
  signUpAndGoToPlans,
} from "../../lib/auth/session-client";

type LoginMode = "login" | "cadastro";

type StatusState = {
  type: "info" | "success" | "warning" | "error";
  message: string;
};

type FormState = {
  fullName: string;
  email: string;
  password: string;
};

type AdminStatus = {
  authenticated: boolean;
  isAdmin: boolean;
  email?: string;
};

const initialForm: FormState = {
  fullName: "",
  email: "",
  password: "",
};

function statusClass(type: StatusState["type"]) {
  if (type === "success") {
    return "border-cyan-300/30 bg-cyan-300/10 text-cyan-100";
  }

  if (type === "warning") {
    return "border-amber-300/30 bg-amber-300/10 text-amber-100";
  }

  if (type === "error") {
    return "border-rose-300/30 bg-rose-300/10 text-rose-100";
  }

  return "border-cyan-300/30 bg-cyan-300/10 text-cyan-100";
}

function cleanRedirect(value: string | null, adminMode: boolean): string {
  if (adminMode) {
    if (value?.startsWith("/admin")) {
      return value;
    }

    return "/admin";
  }

  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  if (
    value === "/login" ||
    value === "/sair" ||
    value.startsWith("/admin")
  ) {
    return "/dashboard";
  }

  return value;
}

function validateForm(mode: LoginMode, form: FormState): string | null {
  if (mode === "cadastro" && !form.fullName.trim()) {
    return "Informe seu nome.";
  }

  if (!form.email.trim()) {
    return "Informe seu e-mail.";
  }

  if (!form.email.includes("@")) {
    return "Informe um e-mail válido.";
  }

  if (!form.password.trim()) {
    return "Informe sua senha.";
  }

  if (form.password.length < 6) {
    return "A senha precisa ter pelo menos 6 caracteres.";
  }

  return null;
}

function forceNavigate(path: string) {
  window.location.href = path;
}

async function checkAdminPermission(): Promise<AdminStatus | null> {
  try {
    const response = await fetch("/api/admin/status", {
      cache: "no-store",
      credentials: "include",
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as AdminStatus;
  } catch {
    return null;
  }
}

export function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const isAdminMode = useMemo(() => {
    const mode = searchParams.get("mode");
    const redirect = searchParams.get("redirect");

    return mode === "admin" || Boolean(redirect?.startsWith("/admin"));
  }, [searchParams]);

  const redirectTo = useMemo(
    () => cleanRedirect(searchParams.get("redirect"), isAdminMode),
    [searchParams, isAdminMode],
  );

  const [mode, setMode] = useState<LoginMode>("login");
  const [form, setForm] = useState<FormState>(initialForm);
  const [status, setStatus] = useState<StatusState | null>(() => {
    if (!isAdminMode && searchParams.get("premium") === "required") {
      return {
        type: "warning",
        message: "Faça login e mantenha um plano ativo para acessar essa área.",
      };
    }

    if (!isAdminMode && searchParams.get("cadastro") === "ok") {
      return {
        type: "success",
        message: "Conta criada. Faça login após ativar seu plano.",
      };
    }

    return null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [lastRedirect, setLastRedirect] = useState<string | null>(null);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function switchMode(nextMode: LoginMode) {
    setMode(nextMode);
    setStatus(null);
    setLastRedirect(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateForm(mode, form);

    if (validationError) {
      setStatus({
        type: "warning",
        message: validationError,
      });
      return;
    }

    setIsLoading(true);
    setStatus({
      type: "info",
      message: isAdminMode
        ? "Validando acesso administrativo..."
        : mode === "login"
          ? "Validando login..."
          : "Criando conta...",
    });

    try {
      if (mode === "cadastro") {
        const result = await signUpAndGoToPlans({
          email: form.email,
          password: form.password,
          fullName: form.fullName,
        });

        if (!result.success) {
          setStatus({
            type: "error",
            message: result.message,
          });
          return;
        }

        const destination = result.redirectTo || "/planos?cadastro=ok";
        setLastRedirect(destination);
        setStatus({
          type: "success",
          message: result.message,
        });

        window.setTimeout(() => {
          forceNavigate(destination);
        }, 500);

        return;
      }

      const result = await signInAndSyncPremiumAccess({
        email: form.email,
        password: form.password,
        redirectTo,
        requirePremium: !isAdminMode,
      });

      if (!result.success) {
        setStatus({
          type: "error",
          message: result.message,
        });
        return;
      }

      if (isAdminMode) {
        if (!result.accessToken) {
          setStatus({
            type: "error",
            message: "Token de sessão não encontrado para validar o Admin.",
          });
          return;
        }

        await createAdminSession(result.accessToken);

        if (typeof window !== "undefined") {
          window.sessionStorage.setItem("planify_admin_tab_unlocked", "true");
        }

        const adminStatus = await checkAdminPermission();

        if (!adminStatus?.authenticated || !adminStatus.isAdmin) {
          setStatus({
            type: "error",
            message: "Login realizado, mas esta conta não possui permissão de administrador.",
          });
          return;
        }

        setLastRedirect("/admin");
        setStatus({
          type: "success",
          message: "Admin validado. Entrando...",
        });

        router.refresh();

        window.setTimeout(() => {
          forceNavigate("/admin");
        }, 350);

        return;
      }

      if (!result.premium) {
        const destination = result.redirectTo || "/planos?premium=required";
        setLastRedirect(destination);
        setStatus({
          type: "warning",
          message:
            result.message ||
            "Sua conta existe, mas ainda não possui plano ativo.",
        });

        window.setTimeout(() => {
          forceNavigate(destination);
        }, 500);

        return;
      }

      const destination = result.redirectTo || "/dashboard";
      setLastRedirect(destination);
      setStatus({
        type: "success",
        message: "Login validado. Entrando...",
      });

      router.refresh();

      window.setTimeout(() => {
        forceNavigate(destination);
      }, 350);
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível concluir o acesso.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="mx-auto flex min-h-[calc(100vh-180px)] max-w-5xl items-center justify-center px-5 py-12 sm:px-8">
      <div className="w-full max-w-xl rounded-[2.25rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-2xl sm:p-8">
        <div className="mb-8">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-cyan-300">
            {isAdminMode ? "Admin" : "Planify"}
          </p>

          <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">
            {isAdminMode ? "Acesso administrativo" : "Entrar no Planify"}
          </h1>

          <p className="mt-4 text-sm leading-7 text-slate-400">
            {isAdminMode
              ? "Use a conta do dono do site."
              : "Acesse sua conta para continuar."}
          </p>
        </div>

        {!isAdminMode ? (
          <div className="flex rounded-2xl border border-white/10 bg-slate-950/50 p-1">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-black transition ${
                mode === "login"
                  ? "bg-white text-slate-950"
                  : "text-slate-300 hover:bg-white/10"
              }`}
            >
              Entrar
            </button>

            <button
              type="button"
              onClick={() => switchMode("cadastro")}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-black transition ${
                mode === "cadastro"
                  ? "bg-white text-slate-950"
                  : "text-slate-300 hover:bg-white/10"
              }`}
            >
              Criar conta
            </button>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
          {!isAdminMode && mode === "cadastro" ? (
            <label className="grid gap-2">
              <span className="text-sm font-bold text-slate-300">Nome</span>
              <input
                value={form.fullName}
                onChange={(event) => updateField("fullName", event.target.value)}
                placeholder="Seu nome completo"
                className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
              />
            </label>
          ) : null}

          <label className="grid gap-2">
            <span className="text-sm font-bold text-slate-300">E-mail</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              placeholder={isAdminMode ? "admin@email.com" : "professor@email.com"}
              autoComplete="email"
              className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
            />
          </label>

          <label className="grid gap-2">
            <span className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-slate-300">Senha</span>
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="text-xs font-bold text-cyan-300 transition hover:text-cyan-100"
                aria-pressed={showPassword}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </span>
            <input
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
              placeholder="Mínimo 6 caracteres"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
            />
          </label>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 rounded-2xl bg-white px-6 py-4 text-sm font-black text-slate-950 shadow-2xl shadow-white/10 transition hover:-translate-y-1 hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading
              ? "Validando..."
              : isAdminMode
                ? "Entrar no Admin"
                : mode === "login"
                  ? "Entrar"
                  : "Criar conta"}
          </button>

          {status ? (
            <div className={`rounded-2xl border p-4 text-sm font-bold ${statusClass(status.type)}`}>
              <div>{status.message}</div>

              {lastRedirect ? (
                <button
                  type="button"
                  onClick={() => forceNavigate(lastRedirect)}
                  className="mt-3 rounded-xl bg-white px-4 py-2 text-xs font-black text-slate-950 transition hover:bg-cyan-100"
                >
                  Continuar
                </button>
              ) : null}
            </div>
          ) : null}
        </form>

        {!isAdminMode ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-slate-950/45 p-5">
            <p className="text-sm font-black text-white">
              Ainda não tem plano ativo?
            </p>
            <Link
              href="/planos"
              className="mt-3 inline-flex text-sm font-black text-cyan-200 transition hover:text-white"
            >
              Ver planos →
            </Link>
          </div>
        ) : (
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-white/10"
            >
              Início
            </Link>

            <Link
              href="/login"
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-white/10"
            >
              Login de usuário
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

export default LoginClient;
