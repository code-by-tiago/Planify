import AppLayoutClient from "@/components/pro/AppLayoutClient";
import PremiumAccessGate from "@/components/premium/PremiumAccessGate";
import { PlanifyPwaRegister } from "@/components/pwa/PlanifyPwaRegister";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PRIVATE_ROBOTS } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: PRIVATE_ROBOTS,
  appleWebApp: {
    capable: true,
    title: "Planify",
    statusBarStyle: "default",
  },
};

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <PremiumAccessGate featureName="o Planify">
      <PlanifyPwaRegister />
      <AppLayoutClient>{children}</AppLayoutClient>
    </PremiumAccessGate>
  );
}
