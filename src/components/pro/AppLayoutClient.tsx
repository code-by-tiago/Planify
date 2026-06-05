"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import PlanifyAppFrame from "@/components/pro/PlanifyAppFrame";

type AppLayoutClientProps = {
  children: ReactNode;
};

/**
 * Dashboard usa shell próprio (sidebar + quadrante). Demais rotas usam PlanifyAppFrame.
 */
export default function AppLayoutClient({ children }: AppLayoutClientProps) {
  const pathname = usePathname();
  const isDashboard = pathname === "/dashboard";

  if (isDashboard) {
    return <>{children}</>;
  }

  return <PlanifyAppFrame compact>{children}</PlanifyAppFrame>;
}
