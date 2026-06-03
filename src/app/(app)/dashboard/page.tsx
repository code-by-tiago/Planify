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
          <main className="planify-ui3 pl-dashboard-root flex h-screen w-screen items-center justify-center overflow-hidden bg-gradient-to-br from-violet-50 to-rose-50">
            <p className="text-sm font-bold text-violet-500">
              Carregando Studio…
            </p>
          </main>
        }
      >
        <PlanifyDashboardShell />
      </Suspense>
    </PremiumAccessGate>
  );
}
