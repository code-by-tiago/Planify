export const LANDING_NAV = [
  { href: "/#professores", label: "Para professores" },
  { href: "/escolas", label: "Para escolas" },
  { href: "/planos", label: "Planos" },
  { href: "/#recursos", label: "Recursos" },
] as const;

export const TRUST_ITEMS = [
  { label: "Alinhado à BNCC", icon: "checkCircle" as const },
  { label: "Google Drive", googleProduct: "drive" as const },
  { label: "Editor integrado", icon: "editor" as const },
  { label: "Google Classroom", googleProduct: "classroom" as const },
];

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
    id: "lista",
    label: "Lista de exercícios",
    icon: "listChecks" as const,
    href: "/login",
  },
  {
    id: "plano-aula",
    label: "Plano de aula",
    icon: "layers" as const,
    href: "/login",
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
      "Envie ao Google Docs, salve no Drive e publique atividades no Classroom conectado.",
    icon: "download" as const,
  },
];

export const HOW_IT_WORKS = [
  {
    step: 1,
    title: "Descreva o que precisa",
    description:
      "Informe disciplina, etapa, tema e objetivos. O Planify entende o contexto pedagógico em português.",
  },
  {
    step: 2,
    title: "IA estrutura o conteúdo",
    description:
      "Receba planejamentos e materiais alinhados à BNCC, com sugestões de habilidades e sequência didática.",
  },
  {
    step: 3,
    title: "Revise e exporte",
    description:
      "Ajuste no editor, exporte ao Google Docs ou envie para o Google Classroom — pronto para usar em sala.",
  },
];

export const STATS = [
  {
    value: "BNCC",
    label: "local integrada",
    detail:
      "Habilidades sugeridas conforme etapa, ano/série e componente — você revisa e ajusta antes de usar.",
  },
  {
    value: "Reservatório",
    label: "didático verificado",
    detail:
      "Contexto pedagógico checado na geração para reduzir conteúdo genérico ou fora de lugar.",
  },
  {
    value: "Material",
    label: "Engine + editor",
    detail:
      "Estruture o rascunho com IA, personalize no editor integrado e finalize sem trocar de ferramenta.",
  },
  {
    value: "Google",
    label: "Docs e Classroom",
    detail:
      "Exporte ao Google Docs, salve no Drive e publique atividades na turma conectada.",
  },
] as const;

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

export const FINAL_BENEFITS = [
  { label: "Pagamento seguro", icon: "lock" as const },
  { label: "Acesso imediato", icon: "spark" as const },
  { label: "Créditos transparentes", icon: "checkCircle" as const },
];
