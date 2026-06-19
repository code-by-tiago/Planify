"use client";

import type { ReactNode } from "react";
import { LandingFooter } from "@/components/public/landing-professor-primeiro/LandingFooter";
import { LandingHeader } from "@/components/public/landing-professor-primeiro/LandingHeader";

type TeachyMarketingLayoutProps = {
  children: ReactNode;
  /** Hide default header (e.g. login pages with custom chrome) */
  hideHeader?: boolean;
  /** Hide default footer */
  hideFooter?: boolean;
  className?: string;
};

/**
 * Public marketing shell — hero, stats, ecosystem, footer.
 * Planify brand (blue/cyan, coruja) — not Teachy purple.
 */
export function TeachyMarketingLayout({
  children,
  hideHeader = false,
  hideFooter = false,
  className = "",
}: TeachyMarketingLayoutProps) {
  return (
    <div
      className={`pf-scope planify-hud planify-ui3 planify-hud-landing planify-public flex min-h-screen flex-col overflow-x-hidden bg-white sm:overflow-x-clip sm:bg-gradient-to-b sm:from-white sm:via-sky-50/60 sm:to-[var(--pf-canvas)] ${className}`}
    >
      {!hideHeader ? <LandingHeader /> : null}
      <div className="flex-1">{children}</div>
      {!hideFooter ? <LandingFooter /> : null}
    </div>
  );
}

export default TeachyMarketingLayout;
