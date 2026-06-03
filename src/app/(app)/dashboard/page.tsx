import PlanifyDashboardShell from "@/components/dashboard/PlanifyDashboardShell";
import PremiumAccessGate from "@/components/premium/PremiumAccessGate";
import type { Metadata } from "next";
import { Suspense } from "react";

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
          <div className="planify-ui3 pl-dashboard-root flex h-screen w-screen items-center justify-center overflow-hidden bg-slate-100">
            <p className="text-sm font-bold text-indigo-600">
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
