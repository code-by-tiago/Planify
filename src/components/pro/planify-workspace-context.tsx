"use client";

import { createContext, useContext, type ReactNode } from "react";

type PlanifyWorkspaceContextValue = {
  /** Painel embutido no /dashboard (já tem barra de título no shell) */
  embeddedInDashboard: boolean;
};

const PlanifyWorkspaceContext = createContext<PlanifyWorkspaceContextValue>({
  embeddedInDashboard: false,
});

export function PlanifyWorkspaceProvider({
  embeddedInDashboard,
  children,
}: {
  embeddedInDashboard: boolean;
  children: ReactNode;
}) {
  return (
    <PlanifyWorkspaceContext.Provider value={{ embeddedInDashboard }}>
      {children}
    </PlanifyWorkspaceContext.Provider>
  );
}

export function usePlanifyWorkspace() {
  return useContext(PlanifyWorkspaceContext);
}

/** Hero encolhe quando o utilizador rola o painel de trabalho */
const PlanifyHeroCollapseContext = createContext(false);

export function PlanifyHeroCollapseProvider({
  collapsed,
  children,
}: {
  collapsed: boolean;
  children: ReactNode;
}) {
  return (
    <PlanifyHeroCollapseContext.Provider value={collapsed}>
      {children}
    </PlanifyHeroCollapseContext.Provider>
  );
}

export function usePlanifyHeroCollapsed() {
  return useContext(PlanifyHeroCollapseContext);
}
