import AppLayoutClient from "@/components/pro/AppLayoutClient";
import PremiumAccessGate from "@/components/premium/PremiumAccessGate";
<<<<<<< HEAD
=======
import { PlanifyPwaRegister } from "@/components/pwa/PlanifyPwaRegister";
>>>>>>> origin/aplicar-melhorias-na-producao
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PRIVATE_ROBOTS } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: PRIVATE_ROBOTS,
<<<<<<< HEAD
=======
  appleWebApp: {
    capable: true,
    title: "Planify",
    statusBarStyle: "default",
  },
>>>>>>> origin/aplicar-melhorias-na-producao
};

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <PremiumAccessGate featureName="o Planify">
<<<<<<< HEAD
=======
      <PlanifyPwaRegister />
>>>>>>> origin/aplicar-melhorias-na-producao
      <AppLayoutClient>{children}</AppLayoutClient>
    </PremiumAccessGate>
  );
}
