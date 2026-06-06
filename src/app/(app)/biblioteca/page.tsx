export const dynamic = "force-dynamic";

import DashboardHubRedirect from "@/components/dashboard/DashboardHubRedirect";
import { PlanifyHubPageFallback } from "@/components/dashboard/PlanifyToolRedirectShell";
import PremiumAccessGate from "@/components/premium/PremiumAccessGate";
import { Suspense } from "react";

export default function BibliotecaPage() {
  return (
    <PremiumAccessGate featureName="a Biblioteca">
      <Suspense fallback={<PlanifyHubPageFallback />}>
        <DashboardHubRedirect legacy="biblioteca" />
      </Suspense>
    </PremiumAccessGate>
  );
}
