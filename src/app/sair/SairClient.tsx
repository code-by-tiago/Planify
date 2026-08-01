"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOutPlanify } from "../../lib/auth/session-client";

type StatusState = "saindo" | "redirecionando" | "fallback";

function goHome() {
  window.location.replace("/");
}

export function SairClient() {
  const hasStarted = useRef(false);
  const [status, setStatus] = useState<StatusState>("saindo");

  useEffect(() => {
    if (hasStarted.current) {
      return;
    }

    hasStarted.current = true;

    const fallbackTimer = window.setTimeout(() => {
      setStatus("fallback");
      goHome();
    }, 2500);

    async function runSignOut() {
      try {
        await signOutPlanify();
      } finally {
        window.clearTimeout(fallbackTimer);
        setStatus("redirecionando");

        window.setTimeout(() => {
          goHome();
        }, 450);
      }
    }

    runSignOut();

    return () => {
      window.clearTimeout(fallbackTimer);
    };
  }, []);

  const message =
    status === "saindo"
      ? "Estamos encerrando sua sessão e removendo o acesso premium deste navegador."
      : status === "redirecionando"
        ? "Sessão encerrada. Voltando para o início..."
        : "Redirecionando para o início...";

  return (
    <section className="mx-auto grid min-h-[70vh] max-w-4xl place-items-center px-5 py-20 text-center sm:px-8">
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 shadow-2xl backdrop-blur-2xl">
        <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-300">
          Planify
        </p>

        <h1 className="mt-4 text-4xl font-black text-white">
          Saindo com segurança...
        </h1>

        <p className="mt-4 text-sm leading-7 text-slate-400">
          {message}
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={goHome}
            className="rounded-2xl bg-white px-6 py-4 text-sm font-black text-slate-950 transition hover:-translate-y-1 hover:bg-cyan-100"
          >
            Voltar ao início agora
          </button>

          <Link
            href="/login"
            className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-black text-white transition hover:-translate-y-1 hover:bg-white/10"
          >
            Entrar novamente
          </Link>
        </div>
      </div>
    </section>
  );
}
