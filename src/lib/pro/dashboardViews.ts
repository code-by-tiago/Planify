export const dashboardSections = [
  "planejamentos",
  "banco-questoes",
  "editor",
  "historico",
  "biblioteca",
  "marketplace",
  "bncc",
  "diretor",
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
  "banco-questoes": "Banco de questões",
  editor: "Editor",
  historico: "Meus materiais",
  biblioteca: "Biblioteca",
  marketplace: "Comunidade",
  bncc: "Progresso BNCC",
  diretor: "Painel do Gestor",
};
