export const dynamic = "force-dynamic";

import DashboardHubRedirect from "@/components/dashboard/DashboardHubRedirect";
import PremiumAccessGate from "@/components/premium/PremiumAccessGate";
import { Suspense } from "react";

export default function PlanejamentosPage() {
  return (
    <PremiumAccessGate featureName="os Planejamentos">
      <Suspense
        fallback={
          <main className="flex h-full min-h-[200px] flex-1 items-center justify-center">
            <p className="text-sm font-bold text-indigo-600">Carregando…</p>
          </main>
        }
      >
        <DashboardHubRedirect section="planejamentos" />
      </Suspense>
    </PremiumAccessGate>
  );
}
