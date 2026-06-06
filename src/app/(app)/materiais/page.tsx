export const dynamic = "force-dynamic";

import MateriaisTipoRedirect from "@/components/materiais/MateriaisTipoRedirect";
import { PlanifyHubPageFallback } from "@/components/dashboard/PlanifyToolRedirectShell";
import PremiumAccessGate from "@/components/premium/PremiumAccessGate";
import { Suspense } from "react";

export default function MateriaisPage() {
  return (
    <PremiumAccessGate featureName="o Gerador IA de Materiais">
      <Suspense fallback={<PlanifyHubPageFallback />}>
        <MateriaisTipoRedirect />
      </Suspense>
    </PremiumAccessGate>
  );
}
