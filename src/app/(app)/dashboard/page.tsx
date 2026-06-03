import PlanifyDashboardShell from "@/components/dashboard/PlanifyDashboardShell";
import PremiumAccessGate from "@/components/premium/PremiumAccessGate";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Studio | Planify",
  description:
    "Central de criação pedagógica — materiais com IA, planejamentos BNCC e ferramentas para professoras.",
};

export default function DashboardPage() {
  return (
    <PremiumAccessGate featureName="o Studio Planify">
      <Suspense
        fallback={
          <div className="planify-ui3 pl-dashboard-root flex h-screen w-screen items-center justify-center overflow-hidden bg-slate-100">
            <p className="text-sm font-bold text-indigo-600">
              Carregando Studio…
            </p>
          </div>
        }
      >
        <PlanifyDashboardShell />
      </Suspense>
    </PremiumAccessGate>
  );
}
