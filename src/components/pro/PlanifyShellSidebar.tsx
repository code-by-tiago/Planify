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
  variant?: "default" | "hud";
  /** Menu lateral sempre visível (painel /dashboard) */
  alwaysVisible?: boolean;
  showUserFooter?: boolean;
  brandHref?: string;
  /** Desktop collapse (icon rail) */
  collapsible?: boolean;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
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
  collapsible = false,
  collapsed = false,
  onToggleCollapsed,
}: PlanifyShellSidebarProps) {
  const isHud = variant === "hud";

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

  const sidebarClass = isHud
    ? "pl-sidebar pl-sidebar-hud pl-sidebar-premium"
    : "pl-sidebar pl-sidebar-premium";

  const footer = showUserFooter ? (
    <PlanifySidebarUser lumiHint={lumiHint} collapsed={collapsed} />
  ) : (
    <div className="border-t border-white/10 px-4 py-3 text-[11px] font-semibold opacity-70">
      {lumiHint}
    </div>
  );

  const collapseToggle =
    collapsible && onToggleCollapsed ? (
      <button
        type="button"
        onClick={onToggleCollapsed}
        aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        title={collapsed ? "Expandir menu" : "Recolher menu"}
        className="pl-sidebar-collapse-btn hidden lg:flex"
      >
        <PlanifyIcon
          name="chevronRight"
          className={["h-4 w-4 transition-transform", collapsed ? "" : "rotate-180"].join(" ")}
        />
      </button>
    ) : null;

  const brandBlock = (
    <div className={`pl-sidebar-brand shrink-0 ${collapsed ? "pl-sidebar-brand--collapsed" : ""}`}>
      <div className="flex min-w-0 flex-1 items-center">
        <PlanifyBrand href={brandHref} dark={isHud} compact={collapsed} hideTagline />
      </div>
      {collapseToggle}
      {!collapsed ? (
        <p className="pl-sidebar-brand-tagline">
          Produção pedagógica com IA · BNCC
        </p>
      ) : null}
    </div>
  );

  const asideClass = [
    sidebarClass,
    collapsed ? "pl-sidebar--collapsed" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const asideWidth = collapsed
    ? "w-[4.5rem] min-w-[4.5rem] max-w-[4.5rem]"
    : alwaysVisible
      ? "w-[min(17.5rem,34vw)] min-w-[15rem]"
      : "w-[17.5rem] min-w-[15rem]";

  const desktopAside = (
    <aside
      aria-label="Menu lateral Planify"
      className={[
        asideClass,
        "flex h-full min-h-0 shrink-0 flex-col border-r transition-[width] duration-200 ease-out",
        asideWidth,
        alwaysVisible ? "h-screen" : "hidden lg:flex",
      ].join(" ")}
    >
      {brandBlock}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      <div className="pl-sidebar-footer shrink-0">{footer}</div>
    </aside>
  );

  if (alwaysVisible) {
    return desktopAside;
  }

  return (
    <>
      {desktopAside}

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
                isHud ? "bg-slate-950/55" : "bg-slate-950/40"
              }`}
              onClick={() => onOpenChange?.(false)}
              aria-hidden="true"
            />
            <motion.aside
              key="drawer"
              aria-label="Menu lateral Planify"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className={`${sidebarClass} fixed inset-y-0 left-0 z-50 flex h-[100dvh] w-[min(17.5rem,88vw)] max-w-[88vw] flex-col border-r shadow-2xl pb-[env(safe-area-inset-bottom)] lg:hidden`}
            >
              <div className="pl-sidebar-brand flex shrink-0 items-center justify-between">
                <PlanifyBrand href={brandHref} dark={isHud} />
                <button
                  type="button"
                  onClick={() => onOpenChange?.(false)}
                  aria-label="Fechar menu"
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400/60"
                >
                  <PlanifyIcon name="close" className="h-5 w-5" />
                </button>
              </div>
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
              <div className="pl-sidebar-footer shrink-0">{footer}</div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
