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
  | "settings";

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
  | "mapa-mental";

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
  { id: "planejamento", label: "Planejamento", icon: "clipboard" },
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
    description: "Estruture uma aula em slides com roteiro do professor.",
    category: "preparar-aulas",
    href: "/materiais?tipo=slides",
    icon: "presentation",
    popular: true,
    primaryFieldLabel: "Tema da apresentação",
    loadingTitle: "Criando apresentação",
    loadingDescription: "Organizando roteiro, títulos, tópicos e sugestões visuais.",
    accent: "from-violet-300 via-fuchsia-300 to-pink-300",
  },
  {
    id: "prova",
    title: "Prova",
    shortTitle: "Prova",
    description: "Gere questões objetivas e discursivas com gabarito.",
    category: "avaliacoes",
    href: "/materiais?tipo=prova",
    icon: "fileText",
    popular: true,
    primaryFieldLabel: "Conteúdo da prova",
    loadingTitle: "Gerando prova",
    loadingDescription: "Montando questões, pontuação e respostas esperadas.",
    accent: "from-sky-300 via-blue-300 to-indigo-300",
  },
  {
    id: "lista",
    title: "Lista de Exercícios",
    shortTitle: "Exercícios",
    description: "Crie listas por assunto, série, dificuldade e gabarito.",
    category: "avaliacoes",
    href: "/materiais?tipo=lista",
    icon: "listChecks",
    popular: true,
    primaryFieldLabel: "Assunto da lista",
    loadingTitle: "Criando lista de exercícios",
    loadingDescription: "Distribuindo questões e níveis de dificuldade.",
    accent: "from-cyan-300 via-sky-300 to-blue-300",
  },
  {
    id: "plano-aula",
    title: "Plano de Aula",
    shortTitle: "Plano de Aula",
    description: "Organize objetivos, metodologia, recursos e avaliação.",
    category: "planejamento",
    href: "/materiais?tipo=plano-aula",
    icon: "clipboard",
    popular: true,
    primaryFieldLabel: "Tema da aula",
    loadingTitle: "Estruturando plano de aula",
    loadingDescription: "Preparando objetivos, etapas e avaliação.",
    accent: "from-emerald-300 via-teal-300 to-cyan-300",
  },
  {
    id: "sequencia",
    title: "Sequência Didática",
    shortTitle: "Sequência",
    description: "Distribua conteúdo em aulas com progressão pedagógica.",
    category: "planejamento",
    href: "/materiais?tipo=sequencia",
    icon: "layers",
    primaryFieldLabel: "Tema da sequência",
    loadingTitle: "Montando sequência didática",
    loadingDescription: "Organizando aulas, atividades e avaliação formativa.",
    accent: "from-teal-300 via-cyan-300 to-sky-300",
  },
  {
    id: "apostila",
    title: "Apostila",
    shortTitle: "Apostila",
    description: "Gere explicação, exemplos, atividades e gabarito.",
    category: "preparar-aulas",
    href: "/materiais?tipo=apostila",
    icon: "book",
    primaryFieldLabel: "Tema da apostila",
    loadingTitle: "Gerando apostila",
    loadingDescription: "Organizando explicações, exemplos e atividades.",
    accent: "from-indigo-300 via-violet-300 to-purple-300",
  },
  {
    id: "atividade",
    title: "Atividade",
    shortTitle: "Atividade",
    description: "Crie comandos claros para alunos e critérios de avaliação.",
    category: "engajar",
    href: "/materiais?tipo=atividade",
    icon: "puzzle",
    primaryFieldLabel: "Tema da atividade",
    loadingTitle: "Criando atividade",
    loadingDescription: "Montando comandos, etapas e fechamento.",
    accent: "from-purple-300 via-violet-300 to-fuchsia-300",
  },
  {
    id: "jogo",
    title: "Jogo Pedagógico",
    shortTitle: "Jogo",
    description: "Crie caça-palavras, cruzadinha, quiz, bingo ou trilha.",
    category: "engajar",
    href: "/materiais?tipo=jogo",
    icon: "puzzle",
    primaryFieldLabel: "Tema do jogo",
    loadingTitle: "Criando jogo pedagógico",
    loadingDescription: "Preparando regras, versão do aluno e solução.",
    accent: "from-rose-300 via-pink-300 to-fuchsia-400",
  },
  {
    id: "projeto",
    title: "Projeto Pedagógico",
    shortTitle: "Projeto",
    description: "Monte projeto com etapas, produto final e rubrica.",
    category: "planejamento",
    href: "/materiais?tipo=projeto",
    icon: "project",
    primaryFieldLabel: "Tema do projeto",
    loadingTitle: "Estruturando projeto",
    loadingDescription: "Criando etapas, cronograma e critérios avaliativos.",
    accent: "from-amber-200 via-orange-200 to-rose-200",
  },
  {
    id: "resumo",
    title: "Resumo",
    shortTitle: "Resumo",
    description: "Crie síntese, conceitos-chave e perguntas de revisão.",
    category: "preparar-aulas",
    href: "/materiais?tipo=resumo",
    icon: "fileText",
    primaryFieldLabel: "Tema do resumo",
    loadingTitle: "Preparando resumo",
    loadingDescription: "Selecionando ideias principais e exemplos.",
    accent: "from-violet-200 via-slate-200 to-rose-200",
  },
  {
    id: "flashcards",
    title: "Flashcards",
    shortTitle: "Flashcards",
    description: "Transforme conteúdo em cartões de revisão.",
    category: "engajar",
    href: "/materiais?tipo=flashcards",
    icon: "cards",
    primaryFieldLabel: "Tema dos flashcards",
    loadingTitle: "Criando flashcards",
    loadingDescription: "Separando perguntas e respostas curtas.",
    accent: "from-lime-300 via-emerald-300 to-teal-300",
  },
  {
    id: "redacao",
    title: "Corretor de Redação",
    shortTitle: "Redação",
    description: "Gere rubrica, devolutiva e orientação de reescrita.",
    category: "correcao",
    href: "/materiais?tipo=redacao",
    icon: "pen",
    primaryFieldLabel: "Tema ou proposta da redação",
    loadingTitle: "Preparando correção orientada",
    loadingDescription: "Organizando critérios, devolutiva e melhorias.",
    accent: "from-rose-300 via-pink-300 to-red-300",
  },
  {
    id: "mapa-mental",
    title: "Mapa Mental",
    shortTitle: "Mapa Mental",
    description: "Organize tema central, ramos e conexões.",
    category: "preparar-aulas",
    href: "/materiais?tipo=mapa-mental",
    icon: "brain",
    primaryFieldLabel: "Tema do mapa mental",
    loadingTitle: "Criando mapa mental",
    loadingDescription: "Relacionando conceitos e tópicos essenciais.",
    accent: "from-purple-300 via-fuchsia-300 to-indigo-300",
  },
];

export const appNavigation = [
  { label: "Início", href: "/dashboard", icon: "home" as const },
  { label: "Materiais", href: "/materiais", icon: "materials" as const },
  { label: "Planejamentos", href: "/planejamentos", icon: "clipboard" as const },
  { label: "Editor", href: "/editor", icon: "editor" as const },
  { label: "Histórico", href: "/historico", icon: "history" as const },
  { label: "Biblioteca", href: "/biblioteca", icon: "library" as const },
  { label: "Marketplace", href: "/marketplace", icon: "market" as const },
  { label: "Planos", href: "/planos", icon: "plans" as const },
];

export function getPlanifyTool(id: string | null | undefined) {
  return planifyTools.find((tool) => tool.id === id) ?? planifyTools[0];
}
