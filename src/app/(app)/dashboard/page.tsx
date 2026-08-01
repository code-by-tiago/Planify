import PlanifyDashboardShell from "@/components/dashboard/PlanifyDashboardShell";
import type { Metadata } from "next";
import { Suspense } from "react";
import { landingPublicToolCount } from "@/lib/pro/teachyLanding";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Painel | Planify",
  description:
    `Painel Planify — materiais com IA, planejamentos BNCC e ${landingPublicToolCount} ferramentas para professoras.`,
};

export default function DashboardPage() {
  return (
    <Suspense
        fallback={
          <div className="planify-hud planify-ui3 planify-hud-app pl-dashboard-root flex h-[100dvh] w-full max-w-[100vw] items-center justify-center overflow-hidden bg-white">
            <p className="text-sm font-bold text-blue-600">
              Carregando painel…
            </p>
          </div>
        }
      >
        <PlanifyDashboardShell />
      </Suspense>
  );
}
