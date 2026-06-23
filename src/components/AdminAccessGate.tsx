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
    <section className="mx-auto flex min-h-[50vh] max-w-4xl items-center justify-center px-5 py-12 sm:px-8">
      <div className="w-full rounded-[1.75rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">
          Admin Planify
        </p>

        {!authenticated ? (
          <>
            <h1 className="mt-4 text-sm font-semibold tracking-tight text-slate-900 sm:text-base">Acesso restrito</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm font-medium leading-7 text-slate-600">
              Entre com a conta do administrador para continuar.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href={loginHref}
                className="inline-flex justify-center rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-bold text-white hover:opacity-95"
              >
                Entrar como admin
              </Link>
              <Link
                href="/"
                className="inline-flex justify-center rounded-full border border-slate-200 px-6 py-3 text-sm font-bold text-slate-700 hover:border-indigo-200"
              >
                Início
              </Link>
            </div>
          </>
        ) : (
          <>
            <h1 className="mt-4 text-sm font-semibold tracking-tight text-slate-900 sm:text-base">Sem permissão</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm font-medium leading-7 text-slate-600">
              {email
                ? `A conta ${email} não é administradora.`
                : "A conta logada não é administradora."}
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/sair"
                className="inline-flex justify-center rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-bold text-white"
              >
                Trocar conta
              </Link>
              <Link
                href="/"
                className="inline-flex justify-center rounded-full border border-slate-200 px-6 py-3 text-sm font-bold text-slate-700"
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
