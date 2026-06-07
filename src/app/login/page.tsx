import { Suspense } from "react";
import { LoginPageClient } from "./LoginPageClient";

function LoginPageFallback() {
  return (
    <main className="planify-hud planify-ui3 planify-public planify-hud-landing flex min-h-screen items-center justify-center">
      <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
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
