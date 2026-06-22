import type { DashboardSectionId } from "@/lib/pro/dashboardViews";
import { GESTOR_SECTION_PATHS } from "@/lib/school/gestor-routes";
import {
  isActivePlanifyToolId,
  isAiToolDisabled,
} from "@/lib/pro/disabled-ai-tools";
import { dashboardToolHref } from "@/lib/pro/toolRoutes";

export {
  DISABLED_AI_TOOLS,
  DISABLED_AI_TOOL_MESSAGE,
  isActivePlanifyToolId,
  isAiToolDisabled,
} from "@/lib/pro/disabled-ai-tools";

export type PlanifyIconName =
  | "home"
  | "materials"
  | "calendar"
  | "clipboard"
  | "presentation"
  | "fileText"
  | "listChecks"
  | "book"
  | "puzzle"
  | "layers"
  | "project"
  | "cards"
  | "pen"
  | "brain"
  | "editor"
  | "history"
  | "library"
  | "market"
  | "plans"
  | "admin"
  | "search"
  | "lock"
  | "spark"
  | "user"
  | "arrowRight"
  | "arrowLeft"
  | "close"
  | "menu"
  | "chevronDown"
  | "chevronRight"
  | "checkCircle"
  | "alertCircle"
  | "infoCircle"
  | "download"
  | "externalLink"
  | "logout"
  | "plus"
  | "trash"
  | "settings"
  | "message"
  | "layers";

export type ToolCategoryId =
  | "todos"
  | "planejamento"
  | "preparar-aulas"
  | "avaliacoes"
  | "engajar"
  | "correcao";

export type PlanifyToolId =
  | "slides"
  | "prova"
  | "lista"
  | "plano-aula"
  | "sequencia"
  | "apostila"
  | "atividade"
  | "jogo"
  | "projeto"
  | "resumo"
  | "flashcards"
  | "redacao"
  | "mapa-mental"
  | "inclusao"
  | "aula-completa"
  | "correcao-ia";

export type PlanifyTool = {
  id: PlanifyToolId;
  title: string;
  shortTitle: string;
  description: string;
  category: ToolCategoryId;
  href: string;
  icon: PlanifyIconName;
  popular?: boolean;
  primaryFieldLabel: string;
  loadingTitle: string;
  loadingDescription: string;
  accent: string;
};

export const toolCategories: {
  id: ToolCategoryId;
  label: string;
  icon: PlanifyIconName;
}[] = [
  { id: "todos", label: "Todos", icon: "spark" },
  { id: "planejamento", label: "Planos de aula", icon: "clipboard" },
  { id: "preparar-aulas", label: "Preparar aulas", icon: "presentation" },
  { id: "avaliacoes", label: "Avaliações", icon: "listChecks" },
  { id: "engajar", label: "Engajar alunos", icon: "puzzle" },
  { id: "correcao", label: "Correção", icon: "pen" },
];

export const planifyTools: PlanifyTool[] = [
  {
    id: "slides",
    title: "Apresentação de Slides",
    shortTitle: "Slides",
    description:
      "Apresentação em sequência didática com roteiro para o professor; revise no editor e exporte ao Google Slides.",
    category: "preparar-aulas",
    href: dashboardToolHref("slides"),
    icon: "presentation",
    popular: true,
    primaryFieldLabel: "Tema da apresentação",
    loadingTitle: "Criando apresentação",
    loadingDescription: "Montando sequência pedagógica, imagens e roteiro de fala.",
    accent: "from-violet-300 via-fuchsia-300 to-pink-300",
  },
  {
    id: "prova",
    title: "Prova",
    shortTitle: "Prova",
    description:
      "Questões objetivas e discursivas com gabarito sugerido; contexto pedagógico verificado antes da geração.",
    category: "avaliacoes",
    href: dashboardToolHref("prova"),
    icon: "fileText",
    popular: true,
    primaryFieldLabel: "Conteúdo da prova",
    loadingTitle: "Gerando prova",
    loadingDescription: "Montando questões, gabarito e critérios de correção.",
    accent: "from-sky-300 via-blue-300 to-indigo-300",
  },
  {
    id: "lista",
    title: "Lista de Exercícios",
    shortTitle: "Lista",
    description:
      "Exercícios com progressão de dificuldade para fixação em sala ou tarefa de casa.",
    category: "avaliacoes",
    href: dashboardToolHref("lista"),
    icon: "listChecks",
    popular: true,
    primaryFieldLabel: "Conteúdo da lista",
    loadingTitle: "Gerando lista",
    loadingDescription: "Criando exercícios alinhados ao tema e à etapa.",
    accent: "from-cyan-300 via-teal-300 to-emerald-300",
  },
  {
    id: "plano-aula",
    title: "Plano de Aula (1 encontro)",
    shortTitle: "Plano de Aula",
    description:
      "Um encontro de aula — objetivos, metodologia, materiais e avaliação. Para planejamento escolar anual ou trimestral, use Planejamentos.",
    category: "planejamento",
    href: dashboardToolHref("plano-aula"),
    icon: "clipboard",
    popular: true,
    primaryFieldLabel: "Tema do plano",
    loadingTitle: "Gerando plano de aula",
    loadingDescription: "Estruturando etapas, recursos e habilidades BNCC.",
    accent: "from-indigo-300 via-violet-300 to-purple-300",
  },
  {
    id: "sequencia",
    title: "Sequência Didática",
    shortTitle: "Sequência",
    description:
      "Várias aulas encadeadas com distribuição de conteúdo, atividades e avaliações ao longo do tempo.",
    category: "planejamento",
    href: dashboardToolHref("sequencia"),
    icon: "layers",
    primaryFieldLabel: "Tema da sequência",
    loadingTitle: "Gerando sequência",
    loadingDescription: "Distribuindo conteúdos e atividades por aula.",
    accent: "from-blue-300 via-indigo-300 to-violet-300",
  },
  {
    id: "apostila",
    title: "Apostila",
    shortTitle: "Apostila",
    description:
      "Material de apoio para alunos com explicações e exemplos; estruturado pelo Material Engine para revisão no editor.",
    category: "preparar-aulas",
    href: dashboardToolHref("apostila"),
    icon: "book",
    primaryFieldLabel: "Tema da apostila",
    loadingTitle: "Gerando apostila",
    loadingDescription: "Organizando capítulos, explicações e exemplos.",
    accent: "from-amber-300 via-orange-300 to-rose-300",
  },
  {
    id: "atividade",
    title: "Atividade",
    shortTitle: "Atividade",
    description:
      "Enunciado, passos e critérios para aplicação em sala ou como tarefa — pronto para ajustar e exportar.",
    category: "engajar",
    href: dashboardToolHref("atividade"),
    icon: "puzzle",
    primaryFieldLabel: "Tema da atividade",
    loadingTitle: "Gerando atividade",
    loadingDescription: "Criando enunciado, passos e critérios.",
    accent: "from-emerald-300 via-green-300 to-lime-300",
  },
  {
    id: "jogo",
    title: "Jogo Pedagógico",
    shortTitle: "Jogo",
    description:
      "Dinâmica ou jogo pedagógico com regras, rodadas e materiais para engajar a turma no tema.",
    category: "engajar",
    href: dashboardToolHref("jogo"),
    icon: "cards",
    primaryFieldLabel: "Tema do jogo",
    loadingTitle: "Gerando jogo",
    loadingDescription: "Propondo regras, rodadas e materiais.",
    accent: "from-pink-300 via-rose-300 to-red-300",
  },
  {
    id: "projeto",
    title: "Projeto",
    shortTitle: "Projeto",
    description:
      "Proposta interdisciplinar com etapas, produto final e critérios de avaliação formativa.",
    category: "engajar",
    href: dashboardToolHref("projeto"),
    icon: "project",
    primaryFieldLabel: "Tema do projeto",
    loadingTitle: "Gerando projeto",
    loadingDescription: "Definindo desafio, cronograma e avaliação.",
    accent: "from-fuchsia-300 via-purple-300 to-violet-300",
  },
  {
    id: "resumo",
    title: "Resumo",
    shortTitle: "Resumo",
    description:
      "Síntese didática do conteúdo para revisão em sala ou entrega aos alunos.",
    category: "preparar-aulas",
    href: dashboardToolHref("resumo"),
    icon: "fileText",
    primaryFieldLabel: "Tema do resumo",
    loadingTitle: "Gerando resumo",
    loadingDescription: "Sintetizando conceitos essenciais.",
    accent: "from-slate-300 via-zinc-300 to-stone-300",
  },
  {
    id: "flashcards",
    title: "Flashcards",
    shortTitle: "Flashcards",
    description:
      "Perguntas e respostas curtas para estudo, revisão e memorização do tema.",
    category: "preparar-aulas",
    href: dashboardToolHref("flashcards"),
    icon: "cards",
    primaryFieldLabel: "Tema dos flashcards",
    loadingTitle: "Gerando flashcards",
    loadingDescription: "Separando perguntas e respostas curtas.",
    accent: "from-lime-300 via-emerald-300 to-teal-300",
  },
  {
    id: "redacao",
    title: "Gerador de Redação",
    shortTitle: "Redação",
    description:
      "Proposta com tema, textos motivadores, comando e critérios — formato ENEM ou escolar, pronta para revisar.",
    category: "avaliacoes",
    href: dashboardToolHref("redacao"),
    icon: "pen",
    primaryFieldLabel: "Tema da redação",
    loadingTitle: "Gerando proposta de redação",
    loadingDescription:
      "Organizando tema, motivadores, comando e critérios para a turma escrever.",
    accent: "from-rose-300 via-pink-300 to-red-300",
  },
  {
    id: "mapa-mental",
    title: "Mapa Mental",
    shortTitle: "Mapa Mental",
    description:
      "Tema central, ramos e conexões organizados no documento para visualizar o conteúdo com a turma.",
    category: "preparar-aulas",
    href: dashboardToolHref("mapa-mental"),
    icon: "brain",
    primaryFieldLabel: "Tema do mapa mental",
    loadingTitle: "Criando mapa mental",
    loadingDescription: "Relacionando conceitos e tópicos essenciais.",
    accent: "from-purple-300 via-fuchsia-300 to-indigo-300",
  },
  {
    id: "inclusao",
    title: "Adaptação Curricular — Inclusão",
    shortTitle: "Inclusão",
    description:
      "Adaptações curriculares (TEA, TDAH, dislexia e outras necessidades) no material que você descreve ou já tem.",
    category: "preparar-aulas",
    href: dashboardToolHref("inclusao"),
    icon: "spark",
    popular: true,
    primaryFieldLabel: "Conteúdo ou observações",
    loadingTitle: "Gerando adaptação inclusiva",
    loadingDescription:
      "Aplicando técnicas de psicopedagogia e inclusão escolar ao seu material.",
    accent: "from-teal-300 via-cyan-300 to-sky-300",
  },
  {
    id: "aula-completa",
    title: "Construtor de Aula Completa",
    shortTitle: "Aula completa",
    description:
      "Um tema gera plano, slides, atividade e lista de fixação coesos — pacote enxuto pronto para sala. Acrescente itens opcionais se quiser.",
    category: "preparar-aulas",
    href: dashboardToolHref("aula-completa"),
    icon: "layers",
    popular: true,
    primaryFieldLabel: "Tema da aula",
    loadingTitle: "Montando aula completa",
    loadingDescription:
      "Gerando plano, slides, atividade e lista com sequência pedagógica coesa.",
    accent: "from-indigo-400 via-violet-400 to-fuchsia-400",
  },
  {
    id: "correcao-ia",
    title: "Corretor de Provas em Papel",
    shortTitle: "Corretor IA",
    description:
      "Fotografe ou envie PDF da prova ou redação — o OCR extrai o texto e a IA corrige com rubrica e devolutiva.",
    category: "correcao",
    href: `${dashboardToolHref("correcao-ia")}&mode=upload`,
    icon: "pen",
    popular: true,
    primaryFieldLabel: "Resposta do estudante",
    loadingTitle: "Corrigindo prova…",
    loadingDescription:
      "Lendo a resposta, aplicando rubrica e preparando devolutiva para a turma.",
    accent: "from-amber-300 via-orange-300 to-rose-300",
  },
];

/** Ferramentas visíveis e utilizáveis no painel (exclui as desativadas por custo de IA). */
export const activePlanifyTools = planifyTools.filter(
  (tool) => !isAiToolDisabled(tool.id),
);

export type AppNavPanel = "inicio" | DashboardSectionId | "external";

export type AppNavItem = {
  label: string;
  href: string;
  icon: PlanifyIconName;
  panel: AppNavPanel;
  /** Visible only when user can view BNCC progress (pro or school member) */
  requiresBnccAccess?: boolean;
  /** Visible only for school_manager or director */
  requiresDirectorAccess?: boolean;
  /** Hidden for manager-view users (they see director panel instead) */
  hideForManagerView?: boolean;
};

/** Navegação lateral — apenas páginas (sem ferramentas IA) */
export const sidebarNavigation: AppNavItem[] = [
  {
    label: "Painel do Gestor",
    href: "/gestor",
    icon: "clipboard",
    panel: "diretor",
    requiresDirectorAccess: true,
  },
  {
    label: "Progresso BNCC",
    href: "/dashboard?secao=bncc",
    icon: "listChecks",
    panel: "bncc",
    requiresBnccAccess: true,
    hideForManagerView: true,
  },
  {
    label: "Editor",
    href: "/dashboard?secao=editor",
    icon: "editor",
    panel: "editor",
    hideForManagerView: true,
  },
  {
    label: "Biblioteca",
    href: "/dashboard?secao=biblioteca",
    icon: "library",
    panel: "biblioteca",
    hideForManagerView: true,
  },
  {
    label: "Comunidade",
    href: "/dashboard?secao=marketplace",
    icon: "market",
    panel: "marketplace",
    hideForManagerView: true,
  },
  {
    label: "Meus materiais",
    href: "/dashboard?secao=historico",
    icon: "history",
    panel: "historico",
    hideForManagerView: true,
  },
  {
    label: "Planos",
    href: "/planos",
    icon: "plans",
    panel: "external",
    hideForManagerView: true,
  },
];

/** Navegação institucional para gestor/diretor (Início = botão primário → /gestor) */
export const managerSidebarNavigation: AppNavItem[] = [
  {
    label: "Professores",
    href: GESTOR_SECTION_PATHS.teachers,
    icon: "user",
    panel: "external",
    requiresDirectorAccess: true,
  },
  {
    label: "Turmas",
    href: GESTOR_SECTION_PATHS.turmas,
    icon: "listChecks",
    panel: "external",
    requiresDirectorAccess: true,
  },
  {
    label: "Materiais",
    href: GESTOR_SECTION_PATHS.materiais,
    icon: "spark",
    panel: "external",
    requiresDirectorAccess: true,
  },
];

/** @deprecated Use sidebarNavigation for sidebar; kept for legacy references */
export const appNavigation: AppNavItem[] = sidebarNavigation;

export function getPlanifyTool(id: string | null | undefined) {
  if (id) {
    const found = planifyTools.find((tool) => tool.id === id);
    if (found) return found;
  }
  return activePlanifyTools[0] ?? planifyTools[0];
}

export function filterSidebarNavigation(input: {
  canViewBnccProgress?: boolean;
  canViewDirectorPanel?: boolean;
  isManagerView?: boolean;
}): AppNavItem[] {
  const source = input.isManagerView
    ? managerSidebarNavigation
    : sidebarNavigation;

  return source.filter((item) => {
    if (item.requiresDirectorAccess && !input.canViewDirectorPanel) {
      return false;
    }
    if (item.requiresBnccAccess && !input.canViewBnccProgress) {
      return false;
    }
    if (input.isManagerView && item.hideForManagerView) {
      return false;
    }
    return true;
  });
}

export const planifyToolCount = activePlanifyTools.length;
