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

export type MaterialMode =
  | "apostila"
  | "atividade"
  | "prova"
  | "slides"
  | "projeto"
  | "jogo"
  | "sequencia"
  | "resumo"
  | "lista"
  | "plano-aula"
  | "flashcards"
  | "redacao"
  | "mapa-mental";

export type MaterialCategory =
  | "todos"
  | "planejamento"
  | "preparar-aulas"
  | "avaliacoes"
  | "engajar"
  | "correcao"
  | "infantil";

export type MaterialModeConfig = {
  id: MaterialMode;
  title: string;
  shortTitle: string;
  icon: string;
  description: string;
  category: MaterialCategory;
  popular?: boolean;
  loadingTitle: string;
  loadingDescription: string;
  primaryFieldLabel: string;
  accent: string;
};

export const studioAreas: StudioArea[] = [
  {
    slug: "planejamentos",
    title: "Planejamento Oficial",
    shortTitle: "Planejar",
    subtitle: "Anual, trimestral e DOCX",
    description:
      "Gere planejamentos com BNCC, matriz pedagógica e modelos oficiais preservados.",
    href: "/planejamentos",
    icon: "🧭",
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
    icon: "✨",
    badge: "Studio",
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
    icon: "📝",
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
    icon: "🗂️",
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
    icon: "📚",
    accent: "from-blue-500 to-indigo-400",
  },
  {
    slug: "marketplace",
    title: "Marketplace",
    shortTitle: "Trocas",
    subtitle: "Comunidade docente",
    description:
      "Publique, baixe e organize materiais compartilhados por professores.",
    href: "/marketplace",
    icon: "🤝",
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
    icon: "💎",
    accent: "from-slate-700 to-slate-500",
  },
  {
    slug: "admin",
    title: "Admin",
    shortTitle: "Admin",
    subtitle: "Gestão do dono",
    description:
      "Área administrativa para biblioteca, materiais, usuários e visão geral.",
    href: "/admin",
    icon: "🛡️",
    accent: "from-zinc-800 to-zinc-600",
  },
];

export const materialCategories: {
  id: MaterialCategory;
  label: string;
  icon: string;
}[] = [
  { id: "todos", label: "Todos", icon: "✨" },
  { id: "planejamento", label: "Planejamento", icon: "📋" },
  { id: "preparar-aulas", label: "Preparar aulas", icon: "🎬" },
  { id: "avaliacoes", label: "Avaliações", icon: "✅" },
  { id: "engajar", label: "Engajar alunos", icon: "🎲" },
  { id: "correcao", label: "Correção", icon: "✍️" },
  { id: "infantil", label: "Educação infantil", icon: "🧸" },
];

export const materialModes: MaterialModeConfig[] = [
  {
    id: "slides",
    title: "Apresentação de Slides",
    shortTitle: "Slides",
    icon: "🖼️",
    category: "preparar-aulas",
    popular: true,
    description:
      "Aula em slides com títulos curtos, tópicos e roteiro do professor.",
    loadingTitle: "Criando seus slides...",
    loadingDescription:
      "Separando ideias por telas, com sequência didática e sugestões visuais.",
    primaryFieldLabel: "Tema da apresentação",
    accent: "from-violet-500 to-purple-400",
  },
  {
    id: "prova",
    title: "Prova Avaliativa",
    shortTitle: "Prova",
    icon: "📄",
    category: "avaliacoes",
    popular: true,
    description:
      "Questões objetivas e discursivas, instruções, pontuação e gabarito.",
    loadingTitle: "Gerando sua prova...",
    loadingDescription:
      "Distribuindo questões, dificuldade, gabarito e critérios de correção.",
    primaryFieldLabel: "Conteúdo da prova",
    accent: "from-amber-500 to-orange-400",
  },
  {
    id: "lista",
    title: "Lista de Exercícios",
    shortTitle: "Exercícios",
    icon: "📝",
    category: "avaliacoes",
    popular: true,
    description:
      "Lista objetiva/discursiva com níveis de dificuldade e gabarito.",
    loadingTitle: "Criando a lista de exercícios...",
    loadingDescription:
      "Montando questões, comandos, dificuldade e respostas esperadas.",
    primaryFieldLabel: "Assunto da lista",
    accent: "from-blue-500 to-cyan-400",
  },
  {
    id: "plano-aula",
    title: "Plano de Aula",
    shortTitle: "Plano de Aula",
    icon: "📋",
    category: "planejamento",
    popular: true,
    description:
      "Plano de aula com objetivos, desenvolvimento, recursos e avaliação.",
    loadingTitle: "Estruturando o plano de aula...",
    loadingDescription:
      "Organizando objetivos, metodologia, recursos e avaliação.",
    primaryFieldLabel: "Tema da aula",
    accent: "from-sky-500 to-cyan-400",
  },
  {
    id: "sequencia",
    title: "Sequência Didática",
    shortTitle: "Sequência",
    icon: "🗂️",
    category: "planejamento",
    description:
      "Conteúdo distribuído em aulas com objetivos, atividades e avaliação.",
    loadingTitle: "Montando a sequência didática...",
    loadingDescription:
      "Organizando aulas, progressão, atividades e avaliação formativa.",
    primaryFieldLabel: "Tema da sequência",
    accent: "from-cyan-500 to-sky-400",
  },
  {
    id: "jogo",
    title: "Jogo Pedagógico",
    shortTitle: "Jogos",
    icon: "🎲",
    category: "engajar",
    description:
      "Caça-palavras, cruzadinha, quiz, bingo, trilha e jogos com layout próprio.",
    loadingTitle: "Criando seu jogo pedagógico...",
    loadingDescription:
      "Montando regras, estrutura do jogo, versão do aluno e gabarito.",
    primaryFieldLabel: "Tema do jogo",
    accent: "from-fuchsia-500 to-pink-400",
  },
  {
    id: "resumo",
    title: "Resumo",
    shortTitle: "Resumo",
    icon: "📑",
    category: "preparar-aulas",
    description:
      "Resumo claro, tópicos essenciais, glossário e perguntas de revisão.",
    loadingTitle: "Preparando seu resumo...",
    loadingDescription:
      "Selecionando ideias principais, exemplos e perguntas de fixação.",
    primaryFieldLabel: "Tema do resumo",
    accent: "from-slate-600 to-slate-400",
  },
  {
    id: "apostila",
    title: "Apostila Completa",
    shortTitle: "Apostila",
    icon: "📘",
    category: "preparar-aulas",
    description:
      "Explicação, exemplos, atividades, gabarito e estrutura para impressão.",
    loadingTitle: "Gerando sua apostila com IA...",
    loadingDescription:
      "Organizando explicações, exemplos, atividades e gabarito em uma estrutura limpa.",
    primaryFieldLabel: "Tema da apostila",
    accent: "from-blue-500 to-cyan-400",
  },
  {
    id: "atividade",
    title: "Atividade Pedagógica",
    shortTitle: "Atividade",
    icon: "🧩",
    category: "engajar",
    description:
      "Comandos claros para alunos, objetivos, tempo estimado e avaliação.",
    loadingTitle: "Criando sua atividade...",
    loadingDescription:
      "Montando comandos, etapas, critérios e proposta adequada à turma.",
    primaryFieldLabel: "Tema da atividade",
    accent: "from-emerald-500 to-teal-400",
  },
  {
    id: "projeto",
    title: "Projeto Pedagógico",
    shortTitle: "Projeto",
    icon: "🚀",
    category: "planejamento",
    description:
      "Objetivos, etapas, produto final, cronograma, avaliação e rubrica.",
    loadingTitle: "Estruturando seu projeto...",
    loadingDescription:
      "Criando etapas, entregáveis, critérios avaliativos e cronograma pedagógico.",
    primaryFieldLabel: "Tema do projeto",
    accent: "from-rose-500 to-pink-400",
  },
  {
    id: "flashcards",
    title: "Flashcards",
    shortTitle: "Flashcards",
    icon: "🃏",
    category: "engajar",
    description:
      "Cartões de pergunta e resposta para revisão rápida e estudo ativo.",
    loadingTitle: "Criando flashcards...",
    loadingDescription:
      "Transformando o conteúdo em cartões objetivos de revisão.",
    primaryFieldLabel: "Tema dos flashcards",
    accent: "from-lime-500 to-emerald-400",
  },
  {
    id: "redacao",
    title: "Corretor de Redação",
    shortTitle: "Redação",
    icon: "✍️",
    category: "correcao",
    description:
      "Critérios, devolutiva, pontos de melhoria e sugestão de reescrita.",
    loadingTitle: "Preparando correção orientada...",
    loadingDescription:
      "Organizando critérios, devolutiva e sugestões pedagógicas.",
    primaryFieldLabel: "Tema ou proposta da redação",
    accent: "from-red-500 to-rose-400",
  },
  {
    id: "mapa-mental",
    title: "Mapa Mental",
    shortTitle: "Mapa Mental",
    icon: "🧠",
    category: "preparar-aulas",
    description:
      "Organização visual em tópicos centrais, ramos e conceitos conectados.",
    loadingTitle: "Criando mapa mental...",
    loadingDescription:
      "Organizando conceitos, relações e tópicos essenciais.",
    primaryFieldLabel: "Tema do mapa mental",
    accent: "from-indigo-500 to-violet-400",
  },
];

export const quickCreate = [
  { label: "Plano anual", href: "/planejamentos", icon: "📅" },
  { label: "Plano trimestral", href: "/planejamentos", icon: "🧭" },
  { label: "Apostila", href: "/materiais?tipo=apostila", icon: "📘" },
  { label: "Prova", href: "/materiais?tipo=prova", icon: "📄" },
  { label: "Slides", href: "/materiais?tipo=slides", icon: "🖼️" },
  { label: "Jogo", href: "/materiais?tipo=jogo", icon: "🎲" },
];

export function getMaterialMode(mode: string | null | undefined) {
  return materialModes.find((item) => item.id === mode) ?? materialModes[0];
}
