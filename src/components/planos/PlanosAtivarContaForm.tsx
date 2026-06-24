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
  checkoutEmail?: string | null;
  sessionId?: string | null;
  onActivated?: () => void;
  /** Página de recuperação pós-pagamento (sem session_id na URL). */
  recoveryMode?: boolean;
};

export function PlanosAtivarContaForm({
  checkoutEmail = null,
  sessionId,
  onActivated,
  recoveryMode = false,
}: PlanosAtivarContaFormProps) {
  const [mode, setMode] = useState<Mode>("create");
  const [email, setEmail] = useState(checkoutEmail || "");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [hasAccount, setHasAccount] = useState<boolean | null>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean | null>(
    null,
  );
  const [statusLoading, setStatusLoading] = useState(false);
  const [recoverySessionId, setRecoverySessionId] = useState("");

  const effectiveSessionId = (sessionId || recoverySessionId).trim() || null;

  useEffect(() => {
    if (checkoutEmail) {
      setEmail(checkoutEmail);
    }
  }, [checkoutEmail]);

  useEffect(() => {
    const normalized = email.trim().toLowerCase();
    if (!normalized.includes("@") || !effectiveSessionId) {
      setHasAccount(null);
      setHasActiveSubscription(null);
      return;
    }

    const sessionIdForStatus = effectiveSessionId;

    let active = true;

    async function loadStatus() {
      setStatusLoading(true);
      try {
        const res = await fetch(
          `/api/public/checkout-account-status?email=${encodeURIComponent(normalized)}&session_id=${encodeURIComponent(sessionIdForStatus)}&sync=1`,
          { cache: "no-store" },
        );
        const json = await res.json().catch(() => null);
        if (!active) return;
        const status = json?.data?.status as string | undefined;
        const exists = status === "account_exists";
        const paid = status === "ready_to_activate";
        setHasAccount(exists);
        setHasActiveSubscription(paid);
        if (exists) {
          setMode("login");
        } else if (paid) {
          setMode("create");
        }
      } catch {
        if (active) {
          setHasAccount(null);
          setHasActiveSubscription(null);
        }
      } finally {
        if (active) setStatusLoading(false);
      }
    }

    void loadStatus();

    return () => {
      active = false;
    };
  }, [email, effectiveSessionId]);

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

    if (mode === "create" && senha.length < 8) {
      setMessage("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    setLoading(true);

    try {
      const result = await activateAccountAfterPayment({
        email: normalizedEmail,
        password: senha,
        sessionId: effectiveSessionId,
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
        {recoveryMode ? "Recuperação" : "Passo 2 de 2"}
      </p>
      <h2 className="mt-2 text-xl font-black text-slate-950">
        {mode === "create" ? "Crie sua senha de acesso" : "Entre na sua conta"}
      </h2>
      <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
        {mode === "create"
          ? hasActiveSubscription
            ? "Encontramos sua assinatura ativa. Defina a senha com o mesmo e-mail usado no pagamento."
            : recoveryMode
              ? "Informe o e-mail do checkout e crie sua senha. Se tiver o link da página de confirmação, cole o código da sessão abaixo para validação mais rápida."
              : "Informe o e-mail do checkout. Se o pagamento acabou de ser feito, aguarde alguns segundos e tente novamente."
          : "Já existe conta com este e-mail. Entre com sua senha para liberar o plano pago."}
      </p>

      {statusLoading ? (
        <p className="mt-3 text-xs font-semibold text-slate-500">
          Verificando pagamento...
        </p>
      ) : null}

      {hasActiveSubscription && !hasAccount && mode === "create" ? (
        <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          Pagamento confirmado para este e-mail. Crie sua senha abaixo.
        </div>
      ) : null}

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

        {recoveryMode && !sessionId ? (
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-700">
              Código da sessão (opcional)
            </span>
            <input
              type="text"
              value={recoverySessionId}
              onChange={(event) => setRecoverySessionId(event.target.value)}
              autoComplete="off"
              placeholder="cs_... (da URL após o pagamento)"
              className={ppInput}
            />
            <span className="mt-1 block text-xs font-medium text-slate-500">
              Está na barra de endereço da página de confirmação, após{" "}
              <code className="text-xs">session_id=</code>.
            </span>
          </label>
        ) : null}

        <label className="block">
          <span className="mb-2 block text-sm font-bold text-slate-700">
            {mode === "create" ? "Criar senha" : "Senha"}
          </span>
          <input
            type="password"
            value={senha}
            onChange={(event) => setSenha(event.target.value)}
            required
            minLength={8}
            autoComplete={mode === "create" ? "new-password" : "current-password"}
            className={ppInput}
            placeholder="Mínimo 8 caracteres"
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
              minLength={8}
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
          Já tenho conta — entrar
        </Link>
      </p>
    </div>
  );
}
