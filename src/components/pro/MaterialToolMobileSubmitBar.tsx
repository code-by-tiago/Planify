"use client";

import type { ReactNode } from "react";

type MaterialToolMobileSubmitBarProps = {
  children: ReactNode;
  className?: string;
};

/** Fixed bottom action bar for mobile generator forms (safe-area aware). */
export function MaterialToolMobileSubmitBar({
  children,
  className = "",
}: MaterialToolMobileSubmitBarProps) {
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-20 border-t border-cyan-400/20 bg-white/95 px-4 py-3 backdrop-blur lg:hidden pb-[env(safe-area-inset-bottom)] ${className}`}
    >
      <div className="mx-auto flex max-w-lg items-center gap-3">{children}</div>
    </div>
  );
}
