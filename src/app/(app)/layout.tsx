import PlanifyAppFrame from "@/components/pro/PlanifyAppFrame";
import { PremiumRouteGuard } from "@/components/PremiumRouteGuard";
import type { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <PlanifyAppFrame compact>
      <PremiumRouteGuard />
      {children}
    </PlanifyAppFrame>
  );
}
