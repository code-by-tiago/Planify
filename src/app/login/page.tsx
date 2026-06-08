import { Suspense } from "react";
import { LoginPageClient } from "./LoginPageClient";

function LoginPageFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white via-emerald-50/40 to-slate-50">
      <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600" />
        Carregando portal de acesso...
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageClient />
    </Suspense>
  );
}
