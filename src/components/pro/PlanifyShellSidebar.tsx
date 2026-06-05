"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, type ReactNode } from "react";
import { PlanifyBrand } from "@/components/pro/PlanifyBrand";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { PlanifySidebarUser } from "@/components/pro/PlanifySidebarUser";

const reduceMotion = {
  hidden: { opacity: 0 },
  show: { opacity: 1 },
};

type PlanifyShellSidebarProps = {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  lumiHint?: string;
  variant?: "default" | "teachy";
  /** Menu lateral sempre visível (painel /dashboard) */
  alwaysVisible?: boolean;
  showUserFooter?: boolean;
  brandHref?: string;
};

export function PlanifyShellSidebar({
  children,
  open = false,
  onOpenChange,
  lumiHint = "Toque numa ferramenta e crie em segundos.",
  variant = "default",
  alwaysVisible = false,
  showUserFooter = true,
  brandHref = "/",
}: PlanifyShellSidebarProps) {
  const isTeachy = variant === "teachy";

  useEffect(() => {
    if (alwaysVisible || !open) return;

    const mq = window.matchMedia("(min-width: 1024px)");
    if (mq.matches) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, alwaysVisible]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onResize = () => {
      if (mq.matches && open) {
        onOpenChange?.(false);
      }
    };

    mq.addEventListener("change", onResize);
    window.addEventListener("resize", onResize);
    onResize();

    return () => {
      mq.removeEventListener("change", onResize);
      window.removeEventListener("resize", onResize);
    };
  }, [open, onOpenChange]);
  const sidebarClass = isTeachy
    ? "pl-sidebar pl-sidebar-teachy"
    : "pl-sidebar";
  const brandBorder = isTeachy
    ? "border-slate-200/80"
    : "border-rose-100/50";
  const footer = showUserFooter ? (
    <PlanifySidebarUser lumiHint={lumiHint} />
  ) : (
    <div className="border-t border-slate-200/80 px-4 py-3 text-[11px] font-semibold text-slate-500">
      {lumiHint}
    </div>
  );

  const brandBlock = (
    <div className={`shrink-0 border-b ${brandBorder} px-4 py-4`}>
      <PlanifyBrand href={brandHref} />
      <p className="mt-2 text-[11px] font-bold leading-snug text-slate-500">
        Coruja Planify · IA alinhada à BNCC
      </p>
    </div>
  );

  if (alwaysVisible) {
    return (
      <aside
        className={`${sidebarClass} flex h-screen w-[min(18rem,34vw)] min-w-[14.5rem] shrink-0 flex-col overflow-hidden border-r`}
      >
        {brandBlock}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
        <div className="shrink-0 border-t border-slate-200/60 bg-inherit">{footer}</div>
      </aside>
    );
  }

  return (
    <>
      <aside
        className={`${sidebarClass} hidden h-full min-h-0 w-72 shrink-0 flex-col overflow-hidden border-r lg:flex`}
      >
        {brandBlock}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
        <div className="shrink-0 border-t border-slate-200/60 bg-inherit">{footer}</div>
      </aside>

      <AnimatePresence>
        {open ? (
          <>
            <motion.div
              key="overlay"
              variants={reduceMotion}
              initial="hidden"
              animate="show"
              exit="hidden"
              transition={{ duration: 0.2 }}
              className={`fixed inset-0 z-40 backdrop-blur-sm lg:hidden ${
                isTeachy ? "bg-slate-900/30" : "bg-violet-950/40"
              }`}
              onClick={() => onOpenChange?.(false)}
              aria-hidden="true"
            />
            <motion.aside
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className={`${sidebarClass} fixed inset-y-0 left-0 z-50 flex h-[100dvh] w-[min(300px,88vw)] max-w-[88vw] flex-col overflow-y-auto overscroll-contain border-r shadow-2xl pb-[env(safe-area-inset-bottom)] lg:hidden`}
            >
              <div
                className={`flex shrink-0 items-center justify-between border-b ${brandBorder} px-4 py-4`}
              >
                <PlanifyBrand href={brandHref} />
                <button
                  type="button"
                  onClick={() => onOpenChange?.(false)}
                  aria-label="Fechar menu"
                  className="flex h-9 w-9 items-center justify-center rounded-2xl text-violet-400 transition hover:bg-white/80"
                >
                  <PlanifyIcon name="close" className="h-5 w-5" />
                </button>
              </div>
              <div className="flex flex-1 flex-col">{children}</div>
              <div className="sticky bottom-0 mt-auto shrink-0">{footer}</div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
