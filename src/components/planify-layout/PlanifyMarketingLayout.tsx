"use client";

import type { ReactNode } from "react";
import { LandingFooter } from "@/components/public/landing-professor-primeiro/LandingFooter";
import { LandingHeader } from "@/components/public/landing-professor-primeiro/LandingHeader";

type PlanifyMarketingLayoutProps = {
  children: ReactNode;
  hideHeader?: boolean;
  hideFooter?: boolean;
  className?: string;
};

/** Public marketing shell — hero, stats, ecosystem, footer. Planify blue/cyan brand. */
export function PlanifyMarketingLayout({
  children,
  hideHeader = false,
  hideFooter = false,
  className = "",
}: PlanifyMarketingLayoutProps) {
  return (
    <div
      className={`pf-scope pf-ecosystem-scope pf-marketing-shell flex min-h-screen flex-col overflow-x-hidden bg-white ${className}`}
    >
      {!hideHeader ? <LandingHeader /> : null}
      <main className="flex-1">{children}</main>
      {!hideFooter ? <LandingFooter /> : null}
    </div>
  );
}

export default PlanifyMarketingLayout;
