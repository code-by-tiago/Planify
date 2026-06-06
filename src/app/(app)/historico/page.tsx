export const dynamic = "force-dynamic";

import DashboardHubRedirect from "@/components/dashboard/DashboardHubRedirect";
import { PlanifyHubPageFallback } from "@/components/dashboard/PlanifyToolRedirectShell";
import PremiumAccessGate from "@/components/premium/PremiumAccessGate";
import { Suspense } from "react";

export default function HistoricoPage() {
  return (
    <PremiumAccessGate featureName="o Histórico">
      <Suspense fallback={<PlanifyHubPageFallback />}>
        <DashboardHubRedirect legacy="historico" />
      </Suspense>
    </PremiumAccessGate>
  );
}
