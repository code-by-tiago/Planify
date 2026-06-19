import type { DashboardSectionId } from "@/lib/pro/dashboardViews";
import {
  planifyTools,
  type PlanifyToolId,
  type ToolCategoryId,
} from "@/lib/pro/planifyTools";

/** Sections that render their own studio/hub header — hide duplicate shell chrome */
export const DASHBOARD_SECTIONS_WITH_OWN_LAYOUT: DashboardSectionId[] = [
  "planejamentos",
  "banco-questoes",
  "editor",
  "historico",
  "biblioteca",
  "marketplace",
  "bncc",
];

export function sectionHasOwnLayout(
  sectionId: DashboardSectionId | null,
): boolean {
  if (!sectionId) return false;
  return DASHBOARD_SECTIONS_WITH_OWN_LAYOUT.includes(sectionId);
}

export type SidebarWorkspaceGroup = {
  id: string;
  label: string;
  sectionIds: DashboardSectionId[];
};

/** Workspace hubs grouped for sidebar navigation */
export const sidebarWorkspaceGroups: SidebarWorkspaceGroup[] = [
  {
    id: "planeje",
    label: "Planeje",
    sectionIds: ["planejamentos", "bncc"],
  },
  {
    id: "revise",
    label: "Revise",
    sectionIds: ["banco-questoes", "editor", "historico"],
  },
  {
    id: "compartilhe",
    label: "Compartilhe",
    sectionIds: ["biblioteca", "marketplace"],
  },
];

export function filterToolsForSidebar(input: {
  query: string;
  category: ToolCategoryId | null;
  limit?: number;
}) {
  const term = input.query.trim().toLowerCase();
  const limit = input.limit ?? 24;

  return planifyTools
    .filter((tool) => {
      const matchCat =
        !input.category ||
        input.category === "todos" ||
        tool.category === input.category;
      const matchTerm =
        !term ||
        tool.title.toLowerCase().includes(term) ||
        tool.shortTitle.toLowerCase().includes(term) ||
        tool.description.toLowerCase().includes(term);
      return matchCat && matchTerm;
    })
    .slice(0, limit);
}

export function isDashboardRouteActive(input: {
  href: string;
  pathname: string;
  search: string;
  selectedToolId?: PlanifyToolId | null;
  selectedSectionId?: DashboardSectionId | null;
}): boolean {
  const { href, pathname, search, selectedToolId, selectedSectionId } = input;
  const [path, query] = href.split("?");
  const currentPath = pathname.split("?")[0];

  if (path === "/dashboard" && query) {
    const expected = new URLSearchParams(query);
    const current = new URLSearchParams(search);

    const tipo = expected.get("tipo");
    const secao = expected.get("secao");

    if (tipo && selectedToolId === tipo) return true;
    if (secao && selectedSectionId === secao && !selectedToolId) return true;

    for (const [key, value] of expected.entries()) {
      if (current.get(key) !== value) return false;
    }
    return true;
  }

  if (href === "/dashboard") {
    return pathname === "/dashboard" && !selectedToolId && !selectedSectionId;
  }

  return currentPath === path || currentPath.startsWith(`${path}/`);
}
