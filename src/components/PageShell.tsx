import type { ReactNode } from "react";
import PlanifyAppFrame from "@/components/pro/PlanifyAppFrame";
import { PremiumRouteGuard } from "./PremiumRouteGuard";

type PageShellProps = {
  children: ReactNode;
};

/**
 * Layout interno legado (admin, 404, etc.) — mesmo shell claro do painel Planify.
 */
export function PageShell({ children }: PageShellProps) {
  return (
    <>
      <PremiumRouteGuard />
      <PlanifyAppFrame compact>{children}</PlanifyAppFrame>
    </>
  );
}

export default PageShell;
