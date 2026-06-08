"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { fetchFullPlanifyAccessStatus } from "@/lib/auth/access-client";
import {
  resolvePostLoginRedirect,
  sanitizeInternalRedirect,
} from "@/lib/auth/post-login-redirect";
import {
  signInAndSyncPremiumAccess,
  signUpAndGoToPlans,
} from "@/lib/auth/session-client";
import { landingPublicToolCount } from "@/lib/pro/teachyLanding";

type Mode = "login" | "signup";
type LoginPortal = "escola" | "professor";

const benefits = [
  `${landingPublicToolCount} ferramentas com IA alinhadas à BNCC`,
  "Construtor de aula completo em um fluxo",
  "Editor integrado, histórico e DOCX oficial",
];

const portalCopy: Record<
  LoginPortal,
  {
    title: string;
    subtitle: string;
    emailPlaceholder: string;
    submitLabel: string;
    heroLead: string;
    loginLead: string;
    premiumHintLead: string;
    premiumHintLink: string;
    footerDisclaimer: string;
    noPlanMessage: string;
  }
> = {
  professor: {
    title: "Portal do Professor",
    subtitle: "Bem-vindo de volta! Prepare suas aulas com IA em minutos.",
    emailPlaceholder: "Seu e-mail",
    submitLabel: "Entrar como Professor",
    heroLead: "professor.",
    loginLead:
      "Use seu e-mail para acessar os geradores com IA, ferramentas alinhadas à BNCC e a exportação em DOCX oficial.",
    premiumHintLead:
      "Entre com um e-mail vinculado a plano ativo ou licença institucional da sua escola, ou ",
    premiumHintLink: "escolha um plano",
    footerDisclaimer:
      "Acesso completo com plano ativo ou licença institucional da sua escola.",
    noPlanMessage:
      "Sua conta existe, mas ainda não possui plano ativo. Ative um plano para continuar.",
  },
  escola: {
    title: "Portal da Escola",
    subtitle: "Acesse o painel de gestão pedagógica da sua instituição.",
    emailPlaceholder: "E-mail institucional",
    submitLabel: "Entrar como Gestor",
    heroLead: "gestor.",
    loginLead:
      "Entre com o e-mail institucional da sua escola para gerenciar equipes, acompanhar o uso e acessar o painel pedagógico.",
    premiumHintLead:
      "Use o e-mail institucional vinculado à licença da sua escola ou ",
    premiumHintLink: "veja as opções institucionais",
    footerDisclaimer:
      "Painel disponível para instituições com licença Planify ativa.",
    noPlanMessage:
      "Sua conta existe, mas a escola ainda não possui licença ativa. Verifique o contrato institucional.",
  },
};

function forceNavigate(path: string) {
  window.location.href = path;
}

function resolvePortal(value: string | null): LoginPortal {
  return value === "escola" ? "escola" : "professor";
}

export function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const portal = resolvePortal(searchParams.get("portal"));
  const copy = portalCopy[portal];
  const redirectParam = searchParams.get("redirect");
  const safeRedirect = sanitizeInternalRedirect(redirectParam);
  const premiumRequired = searchParams.get("premium") === "required";
  const cadastroConfirmar = searchParams.get("cadastro") === "confirmar";
  const sessaoExpirada = searchParams.get("sessao_expirada") === "1";

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(() => {
    if (cadastroConfirmar) {
      return "Confirme o e-mail que enviamos e depois entre com sua senha para escolher um plano.";
    }
    if (sessaoExpirada) {
      return "Sua sessão expirou durante a conexão com o Google. Entre novamente para voltar ao editor.";
    }
    return "";
  });

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
        redirectTo: safeRedirect || undefined,
        requirePremium: false,
      });

      if (!result.success) {
        setMessage(result.message);
        return;
      }

      if (!result.premium) {
        setMessage(result.message || copy.noPlanMessage);
        window.setTimeout(() => {
          forceNavigate(result.redirectTo || "/planos?premium=required");
        }, 600);
        return;
      }

      const accessStatus = await fetchFullPlanifyAccessStatus(result.accessToken);
      const destination = resolvePostLoginRedirect(redirectParam, accessStatus);

      setMessage("Login validado. Entrando...");
      router.refresh();
      window.setTimeout(() => {
        forceNavigate(destination);
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
                  <span className="pl-hud-gradient-text">{copy.heroLead}</span>
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
                copy.loginLead
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
              {mode === "login" ? copy.title : "Criar conta"}
            </h2>
            <p className="mt-2 text-sm font-medium text-slate-500">
              {mode === "login"
                ? copy.subtitle
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
                    {copy.premiumHintLead}
                    <Link
                      href="/planos"
                      className="font-bold text-amber-900 underline"
                    >
                      {copy.premiumHintLink}
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
                  placeholder={
                    mode === "login" ? copy.emailPlaceholder : "professor@email.com"
                  }
                  autoComplete="email"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-950 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-slate-700">Senha</span>
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="text-xs font-bold text-blue-600 transition hover:text-blue-800"
                    aria-pressed={showPassword}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? "Ocultar" : "Mostrar"}
                  </button>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
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
                    ? copy.submitLabel
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
              {copy.footerDisclaimer}
            </p>
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}

export default LoginPageClient;
