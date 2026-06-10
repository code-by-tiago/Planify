export type AppRouteGroup =
  | "public"
  | "premium"
  | "teacher"
  | "admin"
  | "support";

export type AppRoute = {
  href: string;
  label: string;
  description: string;
  group: AppRouteGroup;
  status: "ready" | "visual" | "prepared";
};

export const appRoutes: AppRoute[] = [
  {
    href: "/",
    label: "Início",
    description: "Página pública principal do Planify.",
    group: "public",
    status: "ready",
  },
  {
    href: "/login",
    label: "Login",
    description: "Entrada, cadastro e fluxo de conta para plano ativo.",
    group: "public",
    status: "ready",
  },
  {
    href: "/planos",
    label: "Planos",
    description: "Planos Professor Pro Mensal e Anual com checkout preparado.",
    group: "public",
    status: "ready",
  },
  {
    href: "/contato",
    label: "Contato",
    description: "Contato e suporte visual para professores e escolas.",
    group: "support",
    status: "visual",
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    description: "Central premium do professor.",
    group: "premium",
    status: "ready",
  },
  {
    href: "/planejamentos",
    label: "Planejamentos",
    description: "Fluxo com BNCC oficial e seleção manual de habilidades.",
    group: "teacher",
    status: "ready",
  },
  {
    href: "/materiais",
    label: "Materiais",
    description: "Gerador de materiais didáticos com IA.",
    group: "teacher",
    status: "ready",
  },
  {
    href: "/editor",
    label: "Editor",
    description: "Editor para revisão e exportação de documentos pedagógicos.",
    group: "teacher",
    status: "ready",
  },
  {
    href: "/historico",
    label: "Histórico",
    description: "Histórico de documentos, materiais e itens salvos.",
    group: "teacher",
    status: "ready",
  },
  {
    href: "/biblioteca",
    label: "Biblioteca",
    description: "Biblioteca premium com materiais oficiais e curados.",
    group: "premium",
    status: "ready",
  },
  {
    href: "/marketplace",
    label: "Marketplace",
    description: "Troca de materiais pedagógicos entre professores.",
    group: "premium",
    status: "ready",
  },
  {
    href: "/marketplace/novo",
    label: "Publicar material",
    description: "Publicação de material para o Marketplace.",
    group: "premium",
    status: "ready",
  },
  {
    href: "/admin",
    label: "Admin",
    description: "Painel do dono do site para gestão do SaaS.",
    group: "admin",
    status: "visual",
  },
];

export const mainNavigation = appRoutes.filter((route) =>
  ["/", "/planos", "/login", "/contato"].includes(route.href),
);

export const teacherNavigation = appRoutes.filter((route) =>
  [
    "/dashboard",
    "/planejamentos",
    "/materiais",
    "/editor",
    "/historico",
    "/biblioteca",
    "/marketplace",
  ].includes(route.href),
);

export const adminNavigation = appRoutes.filter((route) => route.group === "admin");

export function getRouteByHref(href: string): AppRoute | undefined {
  return appRoutes.find((route) => route.href === href);
}
