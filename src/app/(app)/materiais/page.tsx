export const dynamic = "force-dynamic";

import MateriaisTipoRedirect from "@/components/materiais/MateriaisTipoRedirect";
import { PlanifyHubPageFallback } from "@/components/dashboard/PlanifyToolRedirectShell";
import { Suspense } from "react";

export default function MateriaisPage() {
  return (
    <Suspense fallback={<PlanifyHubPageFallback />}>
        <MateriaisTipoRedirect />
      </Suspense>
  );
}
