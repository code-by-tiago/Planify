import Link from "next/link";

type OwnerAccessGateProps = {
  authenticated: boolean;
  email?: string;
  redirectTo?: string;
};

export function OwnerAccessGate({
  authenticated,
  email,
  redirectTo = "/admin",
}: OwnerAccessGateProps) {
  const loginHref = `/login?mode=admin&redirect=${encodeURIComponent(redirectTo)}`;

  return (
    <section className="mx-auto flex min-h-[50vh] max-w-4xl items-center justify-center px-5 py-12 sm:px-8">
      <div className="w-full rounded-[1.75rem] border border-cyan-400/20 bg-white p-8 text-center shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-700">
          Proprietário Planify
        </p>

        {!authenticated ? (
          <>
            <h1 className="mt-4 text-sm font-semibold tracking-tight text-slate-900 sm:text-base">Acesso restrito</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm font-medium leading-7 text-slate-600">
              Entre com a conta do proprietário para acessar a administração.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href={loginHref}
                className="pl-hud-btn inline-flex justify-center rounded-full px-6 py-3 text-sm font-bold"
              >
                Entrar como proprietário
              </Link>
              <Link
                href="/"
                className="pl-hud-btn-secondary inline-flex justify-center rounded-full px-6 py-3 text-sm font-bold"
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
                ? `A conta ${email} não é o proprietário do Planify.`
                : "A conta logada não possui permissão de proprietário."}
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/sair"
                className="pl-hud-btn inline-flex justify-center rounded-full px-6 py-3 text-sm font-bold"
              >
                Trocar conta
              </Link>
              <Link
                href="/"
                className="pl-hud-btn-secondary inline-flex justify-center rounded-full px-6 py-3 text-sm font-bold"
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

export default OwnerAccessGate;
