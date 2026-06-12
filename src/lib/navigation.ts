import type { AppRoute } from "../config/routes";
import {
  adminNavigation,
  appRoutes,
  mainNavigation,
  teacherNavigation,
} from "../config/routes";

export type NavigationItem = {
  title: string;
  label: string;
  href: string;
  description: string;
};

export type DashboardCard = {
  title: string;
  href: string;
  description: string;
  badge: string;
  metric: string;
  icon: string;
  accent: string;
};

export type ProductPageFeature = {
  title: string;
  description: string;
  icon?: string;
};

export type ProductPageWorkflowItem = {
  title: string;
  description: string;
};

export type ProductPageContent = {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  primaryAction: string;
  secondaryAction: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  badge: string;
  panelTitle: string;
  panelDescription: string;
  panelItems: string[];
  highlights: string[];
  features: ProductPageFeature[];
  workflow: ProductPageWorkflowItem[];
  steps: ProductPageWorkflowItem[];
  sections: Array<{
    title: string;
    description: string;
    items?: string[];
  }>;
  cta: {
    title: string;
    description: string;
    primaryLabel: string;
    primaryHref: string;
    secondaryLabel: string;
    secondaryHref: string;
  };
  [key: string]: any;
};

function toNavigationItem(route: AppRoute): NavigationItem {
  return {
    title: route.label,
    label: route.label,
    href: route.href,
    description: route.description,
  };
}

function makeContent(input: {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  primaryAction: string;
  secondaryAction: string;
  badge: string;
  panelTitle: string;
  panelDescription: string;
  panelItems: string[];
  highlights: string[];
  features: ProductPageFeature[];
  workflow: ProductPageWorkflowItem[];
}): ProductPageContent {
  return {
    ...input,
    primaryLabel: input.primaryAction,
    primaryHref: input.href,
    secondaryLabel: input.secondaryAction,
    secondaryHref: "/dashboard",
    steps: input.workflow,
    sections: [
      {
        title: input.panelTitle,
        description: input.panelDescription,
        items: input.panelItems,
      },
    ],
    cta: {
      title: input.title,
      description: input.description,
      primaryLabel: input.primaryAction,
      primaryHref: input.href,
      secondaryLabel: input.secondaryAction,
      secondaryHref: "/dashboard",
    },
  };
}

export const navigationItems: NavigationItem[] = mainNavigation.map(toNavigationItem);

export const headerLinks: NavigationItem[] = [
  {
    title: "Início",
    label: "Início",
    href: "/",
    description: "Página inicial do Planify.",
  },
  {
    title: "Planos",
    label: "Planos",
    href: "/planos",
    description: "Planos e assinatura premium.",
  },
  {
    title: "Contato",
    label: "Contato",
    href: "/contato",
    description: "Contato e suporte.",
  },
  {
    title: "Entrar",
    label: "Entrar",
    href: "/login",
    description: "Acesso ao Planify.",
  },
];

export const teacherNavigationItems: NavigationItem[] =
  teacherNavigation.map(toNavigationItem);

export const adminNavigationItems: NavigationItem[] =
  adminNavigation.map(toNavigationItem);

export const dashboardCards: DashboardCard[] = [
  {
    title: "Planejamento escolar",
    href: "/planejamentos",
    description: "Planejamento anual ou trimestral com BNCC oficial — modelos DOCX oficiais.",
    badge: "BNCC oficial",
    metric: "Pronto",
    icon: "planning",
    accent: "cyan",
  },
  {
    title: "Materiais Didáticos",
    href: "/materiais",
    description: "Organize atividades, provas, apostilas, jogos, projetos e sequências.",
    badge: "Visual",
    metric: "Preparado",
    icon: "materials",
    accent: "violet",
  },
  {
    title: "Editor",
    href: "/editor",
    description: "Revise textos pedagógicos e prepare documentos.",
    badge: "Editor",
    metric: "Visual",
    icon: "editor",
    accent: "emerald",
  },
  {
    title: "Histórico",
    href: "/historico",
    description: "Acompanhe planejamentos, materiais e rascunhos.",
    badge: "Organização",
    metric: "Visual",
    icon: "history",
    accent: "amber",
  },
  {
    title: "Biblioteca Premium",
    href: "/biblioteca",
    description: "Materiais oficiais curados pela administração.",
    badge: "Premium",
    metric: "Curadoria",
    icon: "library",
    accent: "cyan",
  },
  {
    title: "Comunidade",
    href: "/marketplace",
    description: "Compartilhe e descubra materiais pedagógicos com outros professores.",
    badge: "Comunidade",
    metric: "Visual",
    icon: "marketplace",
    accent: "violet",
  },
  {
    title: "Admin",
    href: "/admin",
    description: "Gerencie usuários, assinaturas e conteúdos.",
    badge: "Dono",
    metric: "Gestão",
    icon: "admin",
    accent: "rose",
  },
  {
    title: "Planos",
    href: "/planos",
    description: "Gerencie acesso premium e assinatura.",
    badge: "Stripe",
    metric: "Preparado",
    icon: "billing",
    accent: "emerald",
  },
];

const commonFeatures: ProductPageFeature[] = [
  {
    title: "Interface premium",
    description: "Visual profissional, responsivo e preparado para evolução segura.",
  },
  {
    title: "Fluxo organizado",
    description: "Cada área tem objetivo claro dentro do SaaS.",
  },
  {
    title: "Integrações ativas",
    description: "Supabase, Stripe, IA, Storage e exportação Google/DOCX conectados.",
  },
];

export const pageContent: Record<string, ProductPageContent> = {
  planejamentos: makeContent({
    eyebrow: "Planejamentos",
    title: "Planejamentos com BNCC oficial.",
    description: "Use dados pedagógicos, habilidades oficiais e seleção manual para montar planejamentos.",
    href: "/planejamentos",
    primaryAction: "Criar planejamento",
    secondaryAction: "Ver histórico",
    badge: "BNCC oficial",
    panelTitle: "Fluxo de planejamento",
    panelDescription: "Preencha dados, busque BNCC oficial, selecione habilidades e gere uma prévia.",
    panelItems: ["Dados da escola", "Conteúdos", "BNCC oficial", "Prévia estruturada"],
    highlights: ["BNCC oficial", "Seleção manual", "Prévia estruturada", "Exportação DOCX"],
    features: commonFeatures,
    workflow: [
      { title: "Preencher", description: "Informe dados pedagógicos." },
      { title: "Sugerir BNCC", description: "Busque habilidades oficiais." },
      { title: "Gerar prévia", description: "Revise antes da IA e do DOCX." },
    ],
  }),
  materiais: makeContent({
    eyebrow: "Materiais Didáticos",
    title: "Materiais didáticos estruturados.",
    description: "Prepare atividades, provas, apostilas, jogos, projetos, roteiros e sequências.",
    href: "/materiais",
    primaryAction: "Criar material",
    secondaryAction: "Abrir editor",
    badge: "IA integrada",
    panelTitle: "Fluxo de materiais",
    panelDescription: "Organize tipo, tema, conteúdos, objetivos e orientações.",
    panelItems: ["Tipo de material", "Tema", "Conteúdos", "Objetivos", "Prévia"],
    highlights: ["7 tipos", "Prévia visual", "Editor integrado", "IA pedagógica"],
    features: commonFeatures,
    workflow: [
      { title: "Escolher tipo", description: "Defina o material pedagógico." },
      { title: "Preencher dados", description: "Informe tema, conteúdos e objetivos." },
      { title: "Gerar prévia", description: "Veja a estrutura antes da IA." },
    ],
  }),
  editor: makeContent({
    eyebrow: "Editor",
    title: "Editor pedagógico.",
    description: "Revise, ajuste e prepare documentos antes de salvar ou exportar.",
    href: "/editor",
    primaryAction: "Abrir editor",
    secondaryAction: "Ver histórico",
    badge: "Editor",
    panelTitle: "Edição e revisão",
    panelDescription: "Área visual para revisar documentos pedagógicos.",
    panelItems: ["Título", "Tipo", "Conteúdo", "Prévia"],
    highlights: ["Edição visual", "Prévia", "Salvar no histórico", "Exportação Google"],
    features: commonFeatures,
    workflow: [
      { title: "Abrir", description: "Receba ou crie conteúdo." },
      { title: "Editar", description: "Ajuste o documento." },
      { title: "Finalizar", description: "Prepare salvamento e exportação." },
    ],
  }),
  historico: makeContent({
    eyebrow: "Histórico",
    title: "Histórico centralizado.",
    description: "Organize documentos, materiais e itens salvos.",
    href: "/historico",
    primaryAction: "Abrir histórico",
    secondaryAction: "Abrir editor",
    badge: "Organização",
    panelTitle: "Central de documentos",
    panelDescription: "Histórico sincronizado com sua conta Planify.",
    panelItems: ["Planejamentos", "Materiais", "Editor", "Biblioteca", "Comunidade"],
    highlights: ["Busca", "Filtros", "Abrir no editor", "Sincronização na nuvem"],
    features: commonFeatures,
    workflow: [
      { title: "Buscar", description: "Filtre por tipo ou status." },
      { title: "Selecionar", description: "Veja detalhes." },
      { title: "Editar", description: "Abra no editor." },
    ],
  }),
  biblioteca: makeContent({
    eyebrow: "Biblioteca Premium",
    title: "Materiais oficiais e curados.",
    description: "Biblioteca premium separada da Comunidade.",
    href: "/biblioteca",
    primaryAction: "Abrir biblioteca",
    secondaryAction: "Ir à Comunidade",
    badge: "Curadoria",
    panelTitle: "Biblioteca premium",
    panelDescription: "Materiais oficiais administrados pelo dono do site.",
    panelItems: ["Curadoria", "Categorias", "Filtros", "Downloads preparados"],
    highlights: ["Premium", "Admin", "Filtros", "Download PDF/DOCX"],
    features: commonFeatures,
    workflow: [
      { title: "Filtrar", description: "Encontre materiais." },
      { title: "Visualizar", description: "Confira detalhes." },
      { title: "Baixar", description: "Baixe arquivos curados ou abra no editor." },
    ],
  }),
  marketplace: makeContent({
    eyebrow: "Comunidade",
    title: "Materiais compartilhados entre professores.",
    description: "Publique, descubra e baixe materiais pedagógicos com outros docentes.",
    href: "/marketplace",
    primaryAction: "Publicar material",
    secondaryAction: "Ver biblioteca",
    badge: "Comunidade",
    panelTitle: "Comunidade docente",
    panelDescription: "Feed de materiais com anexos, comentários e curadoria entre professores.",
    panelItems: ["Publicação", "Anexos", "Busca", "Downloads", "Moderação"],
    highlights: ["Publicação", "Busca", "Salvar", "Curadoria Planify"],
    features: commonFeatures,
    workflow: [
      { title: "Publicar", description: "Prepare título, descrição e anexo." },
      { title: "Compartilhar", description: "Material aparece para professores." },
      { title: "Moderar", description: "Admin pode revisar publicações quando necessário." },
    ],
  }),
  admin: makeContent({
    eyebrow: "Admin",
    title: "Central do dono do site.",
    description: "Gestão visual de usuários, assinaturas, conteúdos e sistema.",
    href: "/admin",
    primaryAction: "Abrir admin",
    secondaryAction: "Ver dashboard",
    badge: "Dono",
    panelTitle: "Gestão geral do SaaS",
    panelDescription: "Administração visual preparada para dados reais.",
    panelItems: ["Usuários", "Assinaturas", "Biblioteca", "Comunidade", "Sistema"],
    highlights: ["Gestão", "Stripe", "Moderação", "Sistema"],
    features: commonFeatures,
    workflow: [
      { title: "Acompanhar", description: "Veja usuários e assinaturas." },
      { title: "Moderar", description: "Controle conteúdos." },
      { title: "Gerenciar", description: "Prepare ações reais." },
    ],
  }),
  planos: makeContent({
    eyebrow: "Planos",
    title: "Assinatura premium.",
    description: "Planos mensal e anual preparados para checkout.",
    href: "/planos",
    primaryAction: "Ver planos",
    secondaryAction: "Criar conta",
    badge: "Stripe",
    panelTitle: "Acesso premium",
    panelDescription: "Fluxo conta, plano, pagamento e dashboard.",
    panelItems: ["Conta", "Plano", "Checkout", "Webhook", "Acesso"],
    highlights: ["Mensal", "Anual", "Checkout", "Premium"],
    features: commonFeatures,
    workflow: [
      { title: "Criar conta", description: "Usuário se cadastra." },
      { title: "Escolher plano", description: "Seleciona assinatura." },
      { title: "Liberar acesso", description: "Dashboard abre com plano ativo." },
    ],
  }),
};

export const allRoutes = appRoutes;
