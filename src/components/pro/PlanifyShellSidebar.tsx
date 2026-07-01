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
    ? "pl-sidebar pl-sidebar-hud"
    : "pl-sidebar";
  const brandBorder = isHud
    ? "border-slate-200/80"
    : "border-rose-100/50";
  const footer = showUserFooter ? (
    <PlanifySidebarUser lumiHint={lumiHint} collapsed={collapsed} />
  ) : (
    <div className="border-t border-slate-200/80 px-4 py-3 text-[11px] font-semibold text-slate-500">
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
        className={[
          "hidden lg:flex",
          "mx-auto mb-2 h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition",
          isHud
            ? "border-cyan-400/20 text-slate-300 hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-white"
            : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50",
        ].join(" ")}
      >
        <PlanifyIcon
          name="chevronRight"
          className={["h-4 w-4 transition-transform", collapsed ? "" : "rotate-180"].join(" ")}
        />
      </button>
    ) : null;

  const brandBlock = (
    <div className={`shrink-0 border-b ${brandBorder} px-4 py-4 ${collapsed ? "px-2 py-3" : ""}`}>
      <PlanifyBrand href={brandHref} dark={isHud} compact={collapsed} hideTagline />
      {!collapsed ? (
        <p className={`mt-2 text-[11px] font-bold leading-snug ${isHud ? "text-slate-500" : "text-slate-500"}`}>
          Coruja Planify · IA alinhada à BNCC
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

  if (alwaysVisible) {
    return (
      <aside
        className={[
          asideClass,
          "flex h-screen shrink-0 flex-col border-r transition-[width] duration-200",
          collapsed
            ? "w-[4.5rem] min-w-[4.5rem] max-w-[4.5rem]"
            : "w-[min(18rem,34vw)] min-w-[14.5rem]",
        ].join(" ")}
      >
        {brandBlock}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
          {children}
        </div>
        <div className="shrink-0 border-t border-slate-200/60 bg-inherit px-2 py-2">
          {collapseToggle}
          {footer}
        </div>
      </aside>
    );
  }

  return (
    <>
      <aside
        className={[
          asideClass,
          "hidden h-full min-h-0 shrink-0 flex-col border-r transition-[width] duration-200 lg:flex",
          collapsed ? "w-[4.5rem] min-w-[4.5rem] max-w-[4.5rem]" : "w-72 min-w-[18rem]",
        ].join(" ")}
      >
        {brandBlock}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
          {children}
        </div>
        <div className="shrink-0 border-t border-slate-200/60 bg-inherit px-2 py-2">
          {collapseToggle}
          {footer}
        </div>
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
                isHud ? "bg-slate-950/50" : "bg-slate-950/40"
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
              className={`${sidebarClass} fixed inset-y-0 left-0 z-50 flex h-[100dvh] w-[min(300px,88vw)] max-w-[88vw] flex-col border-r shadow-2xl pb-[env(safe-area-inset-bottom)] lg:hidden`}
            >
              <div
                className={`flex shrink-0 items-center justify-between border-b ${brandBorder} px-4 py-4`}
              >
                <PlanifyBrand href={brandHref} />
                <button
                  type="button"
                  onClick={() => onOpenChange?.(false)}
                  aria-label="Fechar menu"
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/10"
                >
                  <PlanifyIcon name="close" className="h-5 w-5" />
                </button>
              </div>
              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
                {children}
              </div>
              <div className="shrink-0 border-t border-slate-200/60">{footer}</div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
