"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import {
  ppBtnPrimary,
  ppBtnSecondary,
  ppInput,
  ppLink,
} from "@/components/public/landing-professor-primeiro/theme";
import {
  activateAccountAfterPayment,
  requestPasswordReset,
} from "@/lib/auth/session-client";

type Mode = "create" | "login";

type PlanosAtivarContaFormProps = {
  checkoutEmail: string | null;
  onActivated?: () => void;
};

export function PlanosAtivarContaForm({
  checkoutEmail,
  onActivated,
}: PlanosAtivarContaFormProps) {
  const [mode, setMode] = useState<Mode>("create");
  const [email, setEmail] = useState(checkoutEmail || "");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [hasAccount, setHasAccount] = useState<boolean | null>(null);

  useEffect(() => {
    if (checkoutEmail) {
      setEmail(checkoutEmail);
    }
  }, [checkoutEmail]);

  useEffect(() => {
    const normalized = email.trim().toLowerCase();
    if (!normalized.includes("@")) {
      setHasAccount(null);
      return;
    }

    let active = true;

    async function loadStatus() {
      try {
        const res = await fetch(
          `/api/public/checkout-account-status?email=${encodeURIComponent(normalized)}`,
          { cache: "no-store" },
        );
        const json = await res.json().catch(() => null);
        if (!active) return;
        const exists = Boolean(json?.data?.hasAccount);
        setHasAccount(exists);
        if (exists) {
          setMode("login");
        }
      } catch {
        if (active) setHasAccount(null);
      }
    }

    void loadStatus();

    return () => {
      active = false;
    };
  }, [email]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const normalizedEmail = email.trim();
    if (!normalizedEmail || !senha.trim()) {
      setMessage("Informe e-mail e senha.");
      return;
    }

    if (mode === "create" && senha !== confirmarSenha) {
      setMessage("As senhas não coincidem.");
      return;
    }

    if (mode === "create" && senha.length < 6) {
      setMessage("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);

    try {
      const result = await activateAccountAfterPayment({
        email: normalizedEmail,
        password: senha,
      });

      setMessage(result.message);

      if (!result.success && !result.needsEmailConfirmation) {
        return;
      }

      if (result.needsEmailConfirmation) {
        return;
      }

      onActivated?.();

      window.setTimeout(() => {
        window.location.href = result.redirectTo || "/dashboard";
      }, 600);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível ativar sua conta.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    setMessage("");
    if (!email.trim()) {
      setMessage("Informe o e-mail usado no pagamento.");
      return;
    }

    setLoading(true);
    try {
      const result = await requestPasswordReset(email.trim());
      setMessage(result.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-700">
        Passo 2 de 2
      </p>
      <h2 className="mt-2 text-xl font-black text-slate-950">
        {mode === "create" ? "Crie sua senha de acesso" : "Entre na sua conta"}
      </h2>
      <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
        {mode === "create"
          ? "Seu pagamento foi confirmado. Defina a senha para acessar o painel com o mesmo e-mail do checkout."
          : "Já existe conta com este e-mail. Entre com sua senha para liberar o plano pago."}
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-slate-700">
            E-mail do pagamento
          </span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            readOnly={Boolean(checkoutEmail)}
            required
            autoComplete="email"
            className={`${ppInput} ${checkoutEmail ? "bg-slate-50 text-slate-600" : ""}`}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-bold text-slate-700">
            {mode === "create" ? "Criar senha" : "Senha"}
          </span>
          <input
            type="password"
            value={senha}
            onChange={(event) => setSenha(event.target.value)}
            required
            minLength={6}
            autoComplete={mode === "create" ? "new-password" : "current-password"}
            className={ppInput}
            placeholder="Mínimo 6 caracteres"
          />
        </label>

        {mode === "create" ? (
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-700">
              Confirmar senha
            </span>
            <input
              type="password"
              value={confirmarSenha}
              onChange={(event) => setConfirmarSenha(event.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className={ppInput}
            />
          </label>
        ) : null}

        {mode === "login" ? (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => void handleForgotPassword()}
              disabled={loading}
              className={`text-xs font-bold ${ppLink}`}
            >
              Esqueci minha senha
            </button>
          </div>
        ) : null}

        {message ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-700">
            {message}
          </div>
        ) : null}

        <button type="submit" disabled={loading} className={`${ppBtnPrimary} w-full`}>
          {loading
            ? "Ativando..."
            : mode === "create"
              ? "Criar senha e entrar"
              : "Entrar e abrir o painel"}
          <PlanifyIcon name="arrowRight" className="h-4 w-4" />
        </button>
      </form>

      <p className="mt-4 text-center text-sm font-medium text-slate-500">
        {mode === "create" ? (
          <>
            Já criou senha antes?{" "}
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`font-bold ${ppLink}`}
            >
              Entrar com senha
            </button>
          </>
        ) : (
          <>
            Primeira vez aqui?{" "}
            <button
              type="button"
              onClick={() => setMode("create")}
              className={`font-bold ${ppLink}`}
            >
              Criar senha
            </button>
          </>
        )}
        {hasAccount === true && mode === "create" ? (
          <span className="mt-2 block text-xs text-amber-700">
            Detectamos conta existente neste e-mail — use Entrar se já definiu senha.
          </span>
        ) : null}
      </p>

      <p className="mt-4 text-center">
        <Link href="/login" className={`text-xs font-semibold ${ppLink}`}>
          Ir para login completo
        </Link>
      </p>
    </div>
  );
}
