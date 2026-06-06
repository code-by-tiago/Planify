import {
  appNavigation,
  getPlanifyTool,
  planifyTools,
  toolCategories,
  type PlanifyToolId,
  type ToolCategoryId,
} from "@/lib/pro/planifyTools";

export type MaterialMode = PlanifyToolId;
export type MaterialCategory = ToolCategoryId;

export type StudioArea = {
  slug: string;
  title: string;
  shortTitle: string;
  subtitle: string;
  description: string;
  href: string;
  icon: string;
  badge?: string;
  featured?: boolean;
  accent: string;
};

export const materialCategories = toolCategories.map((item) => ({
  id: item.id,
  label: item.label,
  icon: item.icon,
}));

export const materialModes = planifyTools.map((tool) => ({
  id: tool.id,
  title: tool.title,
  shortTitle: tool.shortTitle,
  icon: tool.icon,
  description: tool.description,
  category: tool.category,
  popular: tool.popular,
  loadingTitle: tool.loadingTitle,
  loadingDescription: tool.loadingDescription,
  primaryFieldLabel: tool.primaryFieldLabel,
  accent: tool.accent,
}));

export const studioAreas: StudioArea[] = [
  {
    slug: "planejamentos",
    title: "Planejamento Oficial",
    shortTitle: "Planejar",
    subtitle: "Anual, trimestral e DOCX",
    description:
      "Gere planejamentos com BNCC, matriz pedagógica e modelos oficiais preservados.",
    href: "/planejamentos",
    icon: "clipboard",
    badge: "DOCX oficial",
    featured: true,
    accent: "from-sky-500 to-cyan-400",
  },
  {
    slug: "materiais",
    title: "Materiais Didáticos",
    shortTitle: "Materiais",
    subtitle: "Apostilas, provas, slides e jogos",
    description:
      "Crie materiais com estrutura adequada para cada formato, sem misturar tipos.",
    href: "/materiais",
    icon: "materials",
    badge: "Planify",
    featured: true,
    accent: "from-violet-500 to-fuchsia-400",
  },
  {
    slug: "editor",
    title: "Editor Inteligente",
    shortTitle: "Editor",
    subtitle: "Edição estilo Word",
    description:
      "Abra, revise, formate e prepare documentos gerados para impressão e exportação.",
    href: "/editor",
    icon: "editor",
    badge: "ABNT",
    accent: "from-emerald-500 to-teal-400",
  },
  {
    slug: "historico",
    title: "Histórico",
    shortTitle: "Histórico",
    subtitle: "Tudo que você criou",
    description:
      "Recupere planejamentos, materiais e versões para continuar de onde parou.",
    href: "/historico",
    icon: "history",
    accent: "from-amber-500 to-orange-400",
  },
  {
    slug: "biblioteca",
    title: "Biblioteca Premium",
    shortTitle: "Biblioteca",
    subtitle: "Materiais oficiais",
    description:
      "Acesse materiais pedagógicos premium publicados pela administração do Planify.",
    href: "/biblioteca",
    icon: "library",
    accent: "from-blue-500 to-indigo-400",
  },
  {
    slug: "marketplace",
    title: "Comunidade",
    shortTitle: "Trocas",
    subtitle: "Comunidade docente",
    description:
      "Publique, baixe e organize materiais compartilhados por professores.",
    href: "/marketplace",
    icon: "market",
    accent: "from-rose-500 to-pink-400",
  },
  {
    slug: "planos",
    title: "Planos",
    shortTitle: "Planos",
    subtitle: "Assinatura premium",
    description:
      "Gerencie acesso premium, mensalidade, assinatura anual e benefícios.",
    href: "/planos",
    icon: "plans",
    accent: "from-slate-700 to-slate-500",
  },
  {
    slug: "admin",
    title: "Admin",
    shortTitle: "Admin",
    subtitle: "Gestão",
    description:
      "Área administrativa para biblioteca, materiais, usuários e visão geral.",
    href: "/admin",
    icon: "admin",
    accent: "from-zinc-800 to-zinc-600",
  },
];

export const quickCreate = [
  { label: "Plano anual", href: "/planejamentos", icon: "clipboard" },
  { label: "Plano trimestral", href: "/planejamentos", icon: "calendar" },
  { label: "Slides", href: "/materiais?tipo=slides", icon: "presentation" },
  { label: "Prova", href: "/materiais?tipo=prova", icon: "fileText" },
  { label: "Exercícios", href: "/materiais?tipo=lista", icon: "listChecks" },
  { label: "Apostila", href: "/materiais?tipo=apostila", icon: "book" },
];

export const navigationItems = appNavigation;

export function getMaterialMode(mode: string | null | undefined) {
  return getPlanifyTool(mode);
}
