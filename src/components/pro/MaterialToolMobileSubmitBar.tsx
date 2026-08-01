"use client";

<<<<<<< HEAD
import type { ReactNode } from "react";
=======
import { useEffect, useState, type ReactNode } from "react";
>>>>>>> origin/aplicar-melhorias-na-producao

type MaterialToolMobileSubmitBarProps = {
  children: ReactNode;
  className?: string;
};

<<<<<<< HEAD
/** Fixed bottom action bar for mobile generator forms (safe-area aware). */
=======
/**
 * Fixed bottom action bar for mobile generator forms.
 * Keyboard-safe via visualViewport + safe-area inset.
 */
>>>>>>> origin/aplicar-melhorias-na-producao
export function MaterialToolMobileSubmitBar({
  children,
  className = "",
}: MaterialToolMobileSubmitBarProps) {
<<<<<<< HEAD
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-20 border-t border-cyan-400/20 bg-white/95 px-4 py-3 backdrop-blur lg:hidden pb-[env(safe-area-inset-bottom)] ${className}`}
=======
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const viewport = window.visualViewport;
    if (!viewport) return;

    const sync = () => {
      const occluded = Math.max(
        0,
        window.innerHeight - viewport.height - viewport.offsetTop,
      );
      setKeyboardOffset(occluded > 48 ? occluded : 0);
    };

    sync();
    viewport.addEventListener("resize", sync);
    viewport.addEventListener("scroll", sync);
    return () => {
      viewport.removeEventListener("resize", sync);
      viewport.removeEventListener("scroll", sync);
    };
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-20 border-t border-cyan-400/20 bg-white/95 px-4 py-3 backdrop-blur lg:hidden ${className}`}
      style={{
        paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
        transform:
          keyboardOffset > 0 ? `translateY(-${keyboardOffset}px)` : undefined,
      }}
      data-planify-mobile-cta="true"
>>>>>>> origin/aplicar-melhorias-na-producao
    >
      <div className="mx-auto flex max-w-lg items-center gap-3">{children}</div>
    </div>
  );
}
