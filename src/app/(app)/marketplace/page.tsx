export const dynamic = "force-dynamic";

import DashboardHubRedirect from "@/components/dashboard/DashboardHubRedirect";
import { PlanifyHubPageFallback } from "@/components/dashboard/PlanifyToolRedirectShell";
import { Suspense } from "react";

export default function MarketplacePage() {
  return (
    <Suspense fallback={<PlanifyHubPageFallback />}>
        <DashboardHubRedirect legacy="marketplace" />
      </Suspense>
  );
}
