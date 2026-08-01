export const dynamic = "force-dynamic";

import DashboardHubRedirect from "@/components/dashboard/DashboardHubRedirect";
import { PlanifyHubPageFallback } from "@/components/dashboard/PlanifyToolRedirectShell";
import { Suspense } from "react";

export default function EditorPage() {
  return (
    <Suspense fallback={<PlanifyHubPageFallback />}>
        <DashboardHubRedirect legacy="editor" />
      </Suspense>
  );
}
