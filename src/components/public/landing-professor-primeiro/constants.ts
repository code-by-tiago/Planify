export const LANDING_NAV = [
  { href: "/#professores", label: "Para professores" },
  { href: "/#ferramentas", label: "Ferramentas" },
  { href: "/#comunidade", label: "Comunidade" },
  { href: "/#exportacao-google", label: "Google" },
  { href: "/#recursos", label: "Recursos" },
  { href: "/escolas", label: "Para escolas" },
  { href: "/planos", label: "Planos" },
] as const;

export const TRUST_ITEMS = [
  { label: "Alinhado à BNCC", icon: "checkCircle" as const },
  { label: "Exportação Google Docs", icon: "download" as const },
  { label: "Editor integrado", icon: "editor" as const },
  { label: "Google Classroom", icon: "externalLink" as const },
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
    title: "Editor integrado",
    description:
      "Personalize cada rascunho no painel — o passo entre a IA estruturar e você exportar ou publicar.",
    icon: "editor" as const,
  },
  {
    title: "Meus materiais",
    description:
      "Histórico pessoal de rascunhos e versões que você gerou ou importou — reabra e evolua sem recomeçar.",
    icon: "history" as const,
  },
  {
    title: "Créditos por ciclo",
    description:
      "Cada geração consome créditos de forma visível no painel — sem surpresas na fatura.",
    icon: "checkCircle" as const,
  },
  {
    title: "Contexto em português",
    description:
      "Disciplina, etapa e objetivos informados em português orientam a estrutura pedagógica da IA.",
    icon: "spark" as const,
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
      "Receba rascunhos com sequência didática e sugestões de habilidades — prontos para você revisar.",
  },
  {
    step: 3,
    title: "Revise e entregue",
    description:
      "Ajuste no editor integrado e leve para a turma quando estiver satisfeito com o material.",
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
    label: "Engine pedagógico",
    detail:
      "A IA monta rascunhos com contexto verificado — você revisa e personaliza antes de usar em sala.",
  },
  {
    value: "Google",
    label: "integrado",
    detail:
      "OAuth no painel para Docs, Slides, Drive, Forms e Classroom — detalhes na seção Exportação Google.",
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
    topic: "Editor integrado",
    without: "Várias ferramentas desconectadas para criar e ajustar",
    with: "Gere, edite e finalize no mesmo painel",
  },
  {
    topic: "Integração Google",
    without: "Download, formatação manual e publicação em etapas separadas",
    with: "OAuth no painel — Docs, Drive e Classroom sem retrabalho",
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

export const COMMUNITY_FEATURES = [
  {
    title: "Feed e publicações",
    description: "Publique materiais no feed da comunidade e acompanhe o que outros professores compartilham.",
    icon: "market" as const,
  },
  {
    title: "Curtidas e comentários",
    description: "Interaja com posts, troque ideias e descubra materiais relevantes para sua prática.",
    icon: "spark" as const,
  },
  {
    title: "Salvar com cópia",
    description:
      "Ao salvar, o Planify guarda uma cópia sua — ela permanece mesmo se o autor remover o original.",
    icon: "download" as const,
  },
  {
    title: "Perfis e amigos",
    description: "Monte seu perfil, conecte-se com colegas e acompanhe o que publicam.",
    icon: "user" as const,
  },
  {
    title: "Mensagens diretas",
    description: "Converse em particular com outros professores da comunidade.",
    icon: "message" as const,
  },
  {
    title: "Abrir, baixar e visualizar",
    description: "Abra no editor integrado, baixe o arquivo ou visualize antes de reutilizar.",
    icon: "editor" as const,
  },
] as const;

export const COMMUNITY_DIFFERENTIATION = [
  {
    title: "Biblioteca",
    accent: "cyan",
    description:
      "Materiais oficiais e pacotes curados pelo Planify — ponto de partida confiável, não troca entre pares.",
    icon: "library" as const,
  },
  {
    title: "Meus materiais",
    accent: "emerald",
    description:
      "Tudo o que você gerou ou importou no painel — seu repositório pessoal de rascunhos e versões.",
    icon: "history" as const,
  },
  {
    title: "Comunidade",
    accent: "violet",
    description:
      "Rede entre professores premium: compartilhamento entre pares, sem loja nem marketplace de venda.",
    icon: "market" as const,
  },
] as const;

export const GOOGLE_EXPORT_PRODUCTS = [
  {
    product: "drive" as const,
    title: "Google Drive",
    description:
      "Salva uma cópia DOCX no Drive e abre a pasta do arquivo — não o editor do Google Docs.",
  },
  {
    product: "docs" as const,
    title: "Google Docs",
    description: "Exporta um documento editável no Google Docs, pronto para ajustar e compartilhar.",
  },
  {
    product: "slides" as const,
    title: "Google Slides",
    description: "Gera apresentação a partir de decks de slides criados no Planify.",
  },
  {
    product: "forms" as const,
    title: "Google Forms",
    description: "Monta formulário com as questões do material — ideal para provas e atividades.",
  },
  {
    product: "classroom" as const,
    title: "Google Classroom",
    description: "Publica na turma conectada como tarefa ou material, direto do painel.",
  },
] as const;
