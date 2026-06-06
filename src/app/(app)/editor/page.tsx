export const dynamic = "force-dynamic";

import DashboardHubRedirect from "@/components/dashboard/DashboardHubRedirect";
import { PlanifyHubPageFallback } from "@/components/dashboard/PlanifyToolRedirectShell";
import PremiumAccessGate from "@/components/premium/PremiumAccessGate";
import { Suspense } from "react";

export default function EditorPage() {
  return (
    <PremiumAccessGate featureName="o Editor">
      <Suspense fallback={<PlanifyHubPageFallback />}>
        <DashboardHubRedirect legacy="editor" />
      </Suspense>
    </PremiumAccessGate>
  );
}
