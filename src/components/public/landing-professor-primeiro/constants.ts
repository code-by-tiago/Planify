export const TRUST_ITEMS = [
  { label: "Alinhado à BNCC", icon: "checkCircle" as const },
  { label: "Exportação Google Docs", icon: "download" as const },
  { label: "Editor integrado", icon: "editor" as const },
  { label: "Google Classroom", icon: "externalLink" as const },
];

export const FEATURE_GRID = [
  {
    title: "Planejamentos",
    description: "Anual e trimestral alinhados à BNCC com modelos oficiais.",
    icon: "clipboard" as const,
    href: "/planejamento-escolar-com-ia",
  },
  {
    title: "Materiais didáticos",
    description: "Atividades, apostilas, jogos e sequências em minutos.",
    icon: "layers" as const,
    href: "/gerador-de-atividades-com-ia",
  },
  {
    title: "Avaliações",
    description: "Provas e listas com gabarito e critérios pedagógicos.",
    icon: "listChecks" as const,
    href: "/gerador-de-provas-com-ia",
  },
  {
    title: "Editor integrado",
    description: "Gerou, editou e finalizou no mesmo painel.",
    icon: "editor" as const,
    href: "/editor-de-documentos-para-professores",
  },
  {
    title: "Envio facilitado",
    description: "Google Docs, Drive e Classroom em um clique.",
    icon: "externalLink" as const,
    href: "/login",
  },
] as const;

export const SOCIAL_PROOF_STATS = [
  {
    value: 128764,
    suffix: "",
    label: "Planejamentos gerados",
    icon: "clipboard" as const,
  },
  {
    value: 956231,
    suffix: "",
    label: "Materiais criados",
    icon: "layers" as const,
  },
  {
    value: 2500,
    prefix: "+",
    suffix: "",
    label: "Professores ativos",
    icon: "user" as const,
  },
  {
    value: 2384650,
    suffix: "",
    label: "Habilidades BNCC utilizadas",
    icon: "checkCircle" as const,
  },
] as const;

export const HOW_IT_WORKS = [
  {
    step: 1,
    title: "Informe os conteúdos",
    description: "Digite o que vai trabalhar em sala — disciplina, etapa e temas da unidade.",
    icon: "fileText" as const,
  },
  {
    step: 2,
    title: "Escolha as habilidades BNCC",
    description: "A IA sugere habilidades compatíveis. Você revisa e seleciona as que fazem sentido.",
    icon: "checkCircle" as const,
  },
  {
    step: 3,
    title: "Gere o planejamento",
    description: "Planejamento anual ou trimestral preenchido automaticamente, pronto para revisar.",
    icon: "spark" as const,
  },
  {
    step: 4,
    title: "Revise no editor",
    description: "Ajuste textos, metodologias e avaliações no editor integrado — sem trocar de ferramenta.",
    icon: "editor" as const,
  },
  {
    step: 5,
    title: "Envie para o Classroom",
    description: "Exporte ao Google Docs e publique na turma com um clique.",
    icon: "externalLink" as const,
  },
] as const;

export const BEFORE_ITEMS = [
  "Horas procurando habilidades na BNCC",
  "Vários arquivos e planilhas desconectados",
  "Muito retrabalho para formatar e enviar",
  "Cada professor com um padrão diferente",
] as const;

export const AFTER_ITEMS = [
  "BNCC sugerida automaticamente por conteúdo",
  "Planejamento preenchido em minutos",
  "Editor integrado para personalizar tudo",
  "Classroom em um clique, na mesma plataforma",
] as const;

export const MATERIAIS_DIDATICOS = [
  {
    title: "Atividades",
    description: "Listas, exercícios e dinâmicas alinhadas ao tema da aula.",
    icon: "puzzle" as const,
    href: "/gerador-de-atividades-com-ia",
    accent: "from-cyan-500 to-blue-600",
  },
  {
    title: "Apostilas",
    description: "Material de apoio estruturado para impressão ou compartilhamento.",
    icon: "book" as const,
    href: "/apostilas-com-ia-para-professores",
    accent: "from-violet-500 to-purple-600",
  },
  {
    title: "Jogos pedagógicos",
    description: "Gamificação com regras claras e objetivos de aprendizagem.",
    icon: "spark" as const,
    href: "/gerador-de-jogos-pedagogicos",
    accent: "from-emerald-500 to-teal-600",
  },
  {
    title: "Sequências didáticas",
    description: "Aulas completas com introdução, desenvolvimento e avaliação.",
    icon: "layers" as const,
    href: "/aula-completa",
    accent: "from-amber-500 to-orange-600",
  },
  {
    title: "Projetos",
    description: "Propostas interdisciplinares com etapas e produtos finais.",
    icon: "clipboard" as const,
    href: "/materiais",
    accent: "from-rose-500 to-pink-600",
  },
  {
    title: "Provas e avaliações",
    description: "Questões objetivas e dissertativas com gabarito e critérios.",
    icon: "listChecks" as const,
    href: "/gerador-de-provas-com-ia",
    accent: "from-indigo-500 to-blue-700",
  },
] as const;

export const TESTIMONIALS = [
  {
    name: "Mariana Costa",
    role: "Professora de Língua Portuguesa · 6º ao 9º ano",
    quote:
      "Antes eu passava o domingo inteiro no planejamento. Agora gero a matriz em minutos, reviso no editor e mando direto pro Classroom.",
    initials: "MC",
  },
  {
    name: "Ricardo Almeida",
    role: "Professor de História · Ensino Médio",
    quote:
      "A sugestão de habilidades BNCC por conteúdo mudou meu fluxo. Não fico mais caçando código na matriz curricular.",
    initials: "RA",
  },
  {
    name: "Fernanda Lima",
    role: "Professora de Ciências · Anos Finais",
    quote:
      "Uso para planejamento trimestral e materiais de apoio. Tudo no mesmo lugar, com visual profissional para a coordenação.",
    initials: "FL",
  },
] as const;

export const FINAL_BENEFITS = [
  { label: "Pagamento seguro", icon: "lock" as const },
  { label: "Acesso imediato", icon: "spark" as const },
  { label: "Suporte em português", icon: "checkCircle" as const },
];

/** @deprecated use SOCIAL_PROOF_STATS — kept for any legacy imports */
export const STATS = SOCIAL_PROOF_STATS;

export const CREATE_OPTIONS = [
  {
    id: "planejamento",
    label: "Planejamento",
    icon: "clipboard" as const,
    href: "/planejamento-escolar-com-ia",
  },
  {
    id: "prova",
    label: "Prova",
    icon: "listChecks" as const,
    href: "/gerador-de-provas-com-ia",
  },
  {
    id: "slides",
    label: "Slides / Aula",
    icon: "presentation" as const,
    href: "/login",
  },
  {
    id: "apostila",
    label: "Apostila / Material",
    icon: "book" as const,
    href: "/apostilas-com-ia-para-professores",
  },
  {
    id: "atividades",
    label: "Atividades",
    icon: "puzzle" as const,
    href: "/gerador-de-atividades-com-ia",
  },
] as const;

export type CreateOptionId = (typeof CREATE_OPTIONS)[number]["id"];

export const RESOURCES = [
  {
    title: "BNCC local",
    description:
      "Habilidades sugeridas conforme etapa, ano/série e componente — com base na matriz curricular, para você revisar.",
    icon: "checkCircle" as const,
  },
  {
    title: "Biblioteca",
    description:
      "Salve, organize e reabra planejamentos e materiais que você já gerou ou importou no painel.",
    icon: "library" as const,
  },
  {
    title: "Comunidade",
    description:
      "Publique materiais e reutilize modelos compartilhados por outros professores da plataforma.",
    icon: "market" as const,
  },
  {
    title: "Exportação Google",
    description:
      "Envie ao Google Docs ou Slides, salve no Drive e publique atividades no Classroom conectado.",
    icon: "download" as const,
  },
];

export const COMPARISON_ROWS = [
  {
    topic: "Tempo de planejamento",
    without: "Horas em planilhas e cópias de anos anteriores",
    with: "Minutos com estrutura pedagógica pronta para revisar",
  },
  {
    topic: "Alinhamento à BNCC",
    without: "Busca manual de habilidades e risco de desalinhamento",
    with: "Habilidades sugeridas por etapa, ano e componente",
  },
  {
    topic: "Exportação Google Docs",
    without: "Formatação manual, quebras de layout e retrabalho",
    with: "Documento profissional pronto para imprimir ou compartilhar",
  },
  {
    topic: "Editor integrado",
    without: "Várias ferramentas desconectadas para criar e ajustar",
    with: "Gere, edite e finalize no mesmo painel",
  },
  {
    topic: "Google Classroom",
    without: "Download, upload e publicação em etapas separadas",
    with: "Salve no Drive e publique direto na turma",
  },
  {
    topic: "Consistência pedagógica",
    without: "Cada professor com formato e padrão diferente",
    with: "Estrutura uniforme, fácil de revisar em equipe",
  },
] as const;
