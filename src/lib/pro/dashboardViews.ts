export const dashboardSections = [
  "planejamentos",
  "editor",
  "historico",
  "biblioteca",
  "marketplace",
] as const;

export type DashboardSectionId = (typeof dashboardSections)[number];

export function isDashboardSection(
  value: string | null,
): value is DashboardSectionId {
  if (!value) return false;
  return (dashboardSections as readonly string[]).includes(value);
}

export const dashboardSectionLabels: Record<DashboardSectionId, string> = {
  planejamentos: "Planejamentos",
  editor: "Editor",
  historico: "Meus materiais",
  biblioteca: "Biblioteca",
  marketplace: "Comunidade",
};
