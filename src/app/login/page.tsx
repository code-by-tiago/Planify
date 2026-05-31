import { Suspense } from "react";
import { PageShell } from "../../components/PageShell";
import { LoginClient } from "./LoginClient";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <PageShell>
      <Suspense fallback={<LoginFallback />}>
        <LoginClient />
      </Suspense>
    </PageShell>
  );
}

function LoginFallback() {
  return (
    <section className="mx-auto grid min-h-[55vh] max-w-4xl place-items-center px-5 py-16 sm:px-8">
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 text-center shadow-2xl backdrop-blur-2xl">
        <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-300">
          Planify
        </p>
        <h1 className="mt-4 text-3xl font-black text-white">
          Carregando acesso...
        </h1>
      </div>
    </section>
  );
}
