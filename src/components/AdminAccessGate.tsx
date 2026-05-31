import Link from "next/link";

type AdminAccessGateProps = {
  authenticated: boolean;
  email?: string;
  redirectTo?: string;
};

export function AdminAccessGate({
  authenticated,
  email,
  redirectTo = "/admin",
}: AdminAccessGateProps) {
  const loginHref = `/login?mode=admin&redirect=${encodeURIComponent(redirectTo)}`;

  return (
    <section className="mx-auto flex min-h-[calc(100vh-220px)] max-w-4xl items-center justify-center px-5 py-12 sm:px-8">
      <div className="w-full rounded-[2.25rem] border border-white/10 bg-white/[0.06] p-8 text-center shadow-2xl backdrop-blur-2xl">
        <p className="text-sm font-black uppercase tracking-[0.28em] text-cyan-300">
          Admin
        </p>

        {!authenticated ? (
          <>
            <h1 className="mt-4 text-4xl font-black text-white">
              Acesso restrito
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-400">
              Entre com a conta do administrador para continuar.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href={loginHref}
                className="rounded-2xl bg-white px-6 py-4 text-center text-sm font-black text-slate-950 transition hover:-translate-y-1 hover:bg-cyan-100"
              >
                Entrar como Admin
              </Link>

              <Link
                href="/"
                className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-center text-sm font-black text-white transition hover:-translate-y-1 hover:bg-white/10"
              >
                Início
              </Link>
            </div>
          </>
        ) : (
          <>
            <h1 className="mt-4 text-4xl font-black text-white">
              Sem permissão
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-400">
              {email
                ? `A conta ${email} não é administradora.`
                : "A conta logada não é administradora."}
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/sair"
                className="rounded-2xl bg-white px-6 py-4 text-center text-sm font-black text-slate-950 transition hover:-translate-y-1 hover:bg-cyan-100"
              >
                Trocar conta
              </Link>

              <Link
                href="/"
                className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-center text-sm font-black text-white transition hover:-translate-y-1 hover:bg-white/10"
              >
                Início
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default AdminAccessGate;
