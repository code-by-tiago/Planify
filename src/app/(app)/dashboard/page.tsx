import PlanifyDashboardShell from "@/components/dashboard/PlanifyDashboardShell";
import PremiumAccessGate from "@/components/premium/PremiumAccessGate";
import type { Metadata } from "next";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Painel | Planify",
  description:
    "Painel Planify — materiais com IA, planejamentos BNCC e 13 ferramentas para professoras.",
};

export default function DashboardPage() {
  return (
    <PremiumAccessGate featureName="o Planify">
      <Suspense
        fallback={
          <div className="planify-institutional planify-ui3 planify-teachy-app pl-dashboard-root flex h-[100dvh] w-full max-w-[100vw] items-center justify-center overflow-hidden bg-white">
            <p className="text-sm font-bold text-blue-600">
              Carregando painel…
            </p>
          </div>
        }
      >
        <PlanifyDashboardShell />
      </Suspense>
    </PremiumAccessGate>
  );
}
