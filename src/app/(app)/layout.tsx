import AppLayoutClient from "@/components/pro/AppLayoutClient";
import { PremiumRouteGuard } from "@/components/PremiumRouteGuard";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PRIVATE_ROBOTS } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: PRIVATE_ROBOTS,
};

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PremiumRouteGuard />
      <AppLayoutClient>{children}</AppLayoutClient>
    </>
  );
}
