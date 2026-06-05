import AppLayoutClient from "@/components/pro/AppLayoutClient";
import { PremiumRouteGuard } from "@/components/PremiumRouteGuard";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PremiumRouteGuard />
      <AppLayoutClient>{children}</AppLayoutClient>
    </>
  );
}
