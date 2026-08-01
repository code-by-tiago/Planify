import AppLayoutClient from "@/components/pro/AppLayoutClient";
import PremiumAccessGate from "@/components/premium/PremiumAccessGate";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PRIVATE_ROBOTS } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: PRIVATE_ROBOTS,
};

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <PremiumAccessGate featureName="o Planify">
      <AppLayoutClient>{children}</AppLayoutClient>
    </PremiumAccessGate>
  );
}
