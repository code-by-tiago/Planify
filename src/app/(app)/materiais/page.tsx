export const dynamic = "force-dynamic";

import MateriaisTipoRedirect from "@/components/materiais/MateriaisTipoRedirect";
import PremiumAccessGate from "@/components/premium/PremiumAccessGate";
import { Suspense } from "react";

export default function MateriaisPage() {
  return (
    <PremiumAccessGate featureName="o Gerador IA de Materiais">
      <Suspense
        fallback={
          <main className="flex h-full min-h-[200px] flex-1 items-center justify-center">
            <p className="text-sm font-bold text-indigo-600">Carregando…</p>
          </main>
        }
      >
        <MateriaisTipoRedirect />
      </Suspense>
    </PremiumAccessGate>
  );
}
