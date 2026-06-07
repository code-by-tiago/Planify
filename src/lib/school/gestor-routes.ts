export type GestorSectionId = "overview" | "teachers" | "turmas" | "materiais";

export const GESTOR_SECTION_LABELS: Record<GestorSectionId, string> = {
  overview: "Visão geral",
  teachers: "Professores",
  turmas: "Turmas",
  materiais: "Materiais",
};

export const GESTOR_SECTION_PATHS: Record<GestorSectionId, string> = {
  overview: "/gestor",
  teachers: "/gestor/professores",
  turmas: "/gestor/turmas",
  materiais: "/gestor/materiais",
};

const LEGACY_TAB_TO_SECTION: Record<string, GestorSectionId> = {
  overview: "overview",
  teachers: "teachers",
  turmas: "turmas",
  materiais: "materiais",
};

export function gestorSectionFromPath(pathname: string): GestorSectionId {
  if (pathname.startsWith("/gestor/professores")) return "teachers";
  if (pathname.startsWith("/gestor/turmas")) return "turmas";
  if (pathname.startsWith("/gestor/materiais")) return "materiais";
  return "overview";
}

export function gestorPathForSection(section: GestorSectionId): string {
  return GESTOR_SECTION_PATHS[section];
}

export function gestorSectionFromLegacyTab(
  tab: string | null,
): GestorSectionId | null {
  if (!tab) return null;
  return LEGACY_TAB_TO_SECTION[tab] ?? null;
}
