import type { DashboardSectionId } from "@/lib/pro/dashboardViews";
import {
  planifyTools,
  type PlanifyIconName,
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

export type JourneyNavTarget =
  | {
      type: "section";
      sectionId: DashboardSectionId;
      label: string;
      icon: PlanifyIconName;
      requiresBnccAccess?: boolean;
    }
  | {
      type: "tool";
      toolId: PlanifyToolId;
      label: string;
      icon: PlanifyIconName;
    }
  | {
      type: "external";
      href: string;
      label: string;
      icon: PlanifyIconName;
      requiresAdmin?: boolean;
    };

export type SidebarJourneyGroup = {
  id: string;
  label: string;
  items: JourneyNavTarget[];
};

/** Jornada PLANEJE → CRIE → REVISE → COMPARTILHE (+ Geral) */
export const sidebarJourneyGroups: SidebarJourneyGroup[] = [
  {
    id: "planeje",
    label: "Planeje",
    items: [
      {
        type: "section",
        sectionId: "planejamentos",
        label: "Planejamentos",
        icon: "clipboard",
      },
      {
        type: "tool",
        toolId: "plano-aula",
        label: "Plano de Aula",
        icon: "clipboard",
      },
      {
        type: "tool",
        toolId: "sequencia",
        label: "Sequências",
        icon: "layers",
      },
      {
        type: "section",
        sectionId: "bncc",
        label: "Progresso BNCC",
        icon: "listChecks",
        requiresBnccAccess: true,
      },
    ],
  },
  {
    id: "crie",
    label: "Crie",
    items: [
      {
        type: "tool",
        toolId: "slides",
        label: "Materiais",
        icon: "presentation",
      },
      {
        type: "tool",
        toolId: "atividade",
        label: "Atividades",
        icon: "puzzle",
      },
      {
        type: "tool",
        toolId: "prova",
        label: "Provas",
        icon: "fileText",
      },
      {
        type: "tool",
        toolId: "jogo",
        label: "Jogos",
        icon: "cards",
      },
      {
        type: "tool",
        toolId: "apostila",
        label: "Apostilas",
        icon: "book",
      },
      {
        type: "section",
        sectionId: "banco-questoes",
        label: "Banco de questões",
        icon: "library",
      },
    ],
  },
  {
    id: "revise",
    label: "Revise",
    items: [
      {
        type: "section",
        sectionId: "editor",
        label: "Editor",
        icon: "editor",
      },
      {
        type: "tool",
        toolId: "correcao-ia",
        label: "Correção IA",
        icon: "pen",
      },
      {
        type: "tool",
        toolId: "inclusao",
        label: "Inclusão",
        icon: "spark",
      },
    ],
  },
  {
    id: "compartilhe",
    label: "Compartilhe",
    items: [
      {
        type: "section",
        sectionId: "editor",
        label: "Classroom",
        icon: "externalLink",
      },
      {
        type: "section",
        sectionId: "biblioteca",
        label: "Biblioteca",
        icon: "library",
      },
      {
        type: "section",
        sectionId: "marketplace",
        label: "Comunidade",
        icon: "market",
      },
    ],
  },
  {
    id: "geral",
    label: "Geral",
    items: [
      {
        type: "section",
        sectionId: "historico",
        label: "Histórico",
        icon: "history",
      },
      {
        type: "external",
        href: "/planos",
        label: "Planos",
        icon: "plans",
      },
      {
        type: "external",
        href: "/admin",
        label: "Admin",
        icon: "admin",
        requiresAdmin: true,
      },
    ],
  },
];

/** @deprecated Use sidebarJourneyGroups */
export type SidebarWorkspaceGroup = {
  id: string;
  label: string;
  sectionIds: DashboardSectionId[];
};

/** @deprecated Use sidebarJourneyGroups */
export const sidebarWorkspaceGroups: SidebarWorkspaceGroup[] = [];

export function getJourneyCuratedToolIds(): Set<PlanifyToolId> {
  const ids = new Set<PlanifyToolId>();
  for (const group of sidebarJourneyGroups) {
    for (const item of group.items) {
      if (item.type === "tool") ids.add(item.toolId);
    }
  }
  return ids;
}

export function filterJourneyGroups(input: {
  canViewBnccProgress?: boolean;
  isSiteAdmin?: boolean;
}): SidebarJourneyGroup[] {
  return sidebarJourneyGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.type === "section" && item.sectionId === "banco-questoes") {
          return false;
        }
        if (item.type === "section" && item.requiresBnccAccess && !input.canViewBnccProgress) {
          return false;
        }
        if (item.type === "external" && item.requiresAdmin && !input.isSiteAdmin) {
          return false;
        }
        return true;
      }),
    }))
    .filter((group) => group.items.length > 0);
}

export function filterToolsForSidebar(input: {
  query: string;
  category: ToolCategoryId | null;
  limit?: number;
  excludeToolIds?: Set<PlanifyToolId>;
}) {
  const term = input.query.trim().toLowerCase();
  const limit = input.limit ?? 24;
  const exclude = input.excludeToolIds ?? new Set<PlanifyToolId>();

  return planifyTools
    .filter((tool) => {
      if (exclude.has(tool.id)) return false;
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
