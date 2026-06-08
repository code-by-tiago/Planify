export const LANDING_NAV = [
  { href: "/#professores", label: "Para professores" },
  { href: "/escolas", label: "Para escolas" },
  { href: "/planos", label: "Planos" },
  { href: "/#recursos", label: "Recursos" },
] as const;

export const TRUST_ITEMS = [
  { label: "Alinhado à BNCC", icon: "checkCircle" as const },
  { label: "Exportação em DOCX", icon: "download" as const },
  { label: "Editor integrado", icon: "editor" as const },
  { label: "Google Classroom", icon: "externalLink" as const },
];

export const CREATE_OPTIONS = [
  {
    id: "planejamento",
    label: "Planejamento",
    icon: "clipboard" as const,
    href: "/planejamentos",
  },
  {
    id: "prova",
    label: "Prova",
    icon: "listChecks" as const,
    href: "/dashboard?tipo=prova",
  },
  {
    id: "slides",
    label: "Slides / Aula",
    icon: "presentation" as const,
    href: "/dashboard?tipo=slides",
  },
  {
    id: "apostila",
    label: "Apostila / Material",
    icon: "book" as const,
    href: "/dashboard?tipo=apostila",
  },
  {
    id: "atividades",
    label: "Atividades",
    icon: "puzzle" as const,
    href: "/dashboard?tipo=atividade",
  },
] as const;

export type CreateOptionId = (typeof CREATE_OPTIONS)[number]["id"];

export const RESOURCES = [
  {
    title: "BNCC alinhada",
    description:
      "Habilidades e competências sugeridas conforme etapa, ano/série e componente curricular — você revisa e ajusta.",
    icon: "checkCircle" as const,
  },
  {
    title: "Exportação DOCX",
    description:
      "Gere documentos prontos para imprimir ou compartilhar, com formatação profissional e estrutura pedagógica.",
    icon: "download" as const,
  },
  {
    title: "Editor integrado",
    description:
      "Revise, personalize e finalize seus materiais no mesmo painel — sem trocar de ferramenta.",
    icon: "editor" as const,
  },
  {
    title: "Google Classroom",
    description:
      "Conecte o Google, salve no Drive e publique atividades diretamente na turma.",
    icon: "externalLink" as const,
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
      "Ajuste no editor, exporte em DOCX ou envie para o Google Classroom — pronto para usar em sala.",
  },
];

export const STATS = [
  {
    value: "Milhares",
    label: "de materiais criados",
    detail: "Planejamentos, provas, slides e atividades gerados na plataforma",
  },
  {
    value: "Professores",
    label: "em todo o Brasil",
    detail: "Ferramenta pensada para a rotina real de quem leciona na educação básica",
  },
  {
    value: "Horas",
    label: "economizadas por semana",
    detail: "Menos tempo em planilhas e documentos, mais tempo em sala",
  },
  {
    value: "BNCC",
    label: "habilidades alinhadas",
    detail: "Sugestões de competências conforme etapa, ano e componente",
  },
] as const;

export const COMPARISON_ROWS = [
  {
    topic: "Tempo de planejamento",
    without: "Horas em planilhas, Word e cópias de anos anteriores",
    with: "Minutos com estrutura pedagógica pronta para revisar",
  },
  {
    topic: "Alinhamento à BNCC",
    without: "Busca manual de habilidades e risco de desalinhamento",
    with: "Habilidades sugeridas por etapa, ano e componente",
  },
  {
    topic: "Exportação DOCX",
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

export const FEATURED_TESTIMONIAL = {
  quote:
    "O Planify transformou minha rotina. O que levava um fim de semana inteiro agora faço em uma tarde — com qualidade e BNCC alinhada.",
  name: "Fernanda L.",
  role: "Professora de Ciências",
  badge: "Ensino Fundamental II",
  rating: 5,
} as const;

export const TESTIMONIALS = [
  {
    name: "Juliana A.",
    role: "Professora de Língua Portuguesa · 8º ano",
    quote:
      "Reduzi de horas para minutos o planejamento anual. A BNCC vem sugerida e eu só adapto ao meu contexto.",
    badge: "Planejamento",
    rating: 5,
  },
  {
    name: "Carlos M.",
    role: "Professor de História · Ensino Médio",
    quote:
      "As provas e slides saem estruturados. Exporto em DOCX e já uso na aula no mesmo dia.",
    badge: "Provas e slides",
    rating: 5,
  },
  {
    name: "Patrícia S.",
    role: "Coordenadora pedagógica",
    quote:
      "A equipe ganhou consistência nos planejamentos. Tudo alinhado à BNCC e fácil de revisar.",
    badge: "Coordenação",
    rating: 5,
  },
  {
    name: "Ricardo T.",
    role: "Professor de Matemática · 6º ao 9º",
    quote:
      "O editor integrado mudou meu fluxo. Gero, ajusto e publico no Classroom sem sair do Planify.",
    badge: "Google Classroom",
    rating: 5,
  },
  {
    name: "Ana Paula R.",
    role: "Professora de Geografia · Ensino Médio",
    quote:
      "Consigo manter o mesmo padrão em todas as turmas. A coordenação elogia a organização dos meus planejamentos.",
    badge: "BNCC",
    rating: 5,
  },
  {
    name: "Marcos V.",
    role: "Professor de Educação Física",
    quote:
      "Atividades e avaliações prontas em minutos. Exporto em DOCX e já levo impresso para a aula.",
    badge: "Exportação DOCX",
    rating: 4,
  },
  {
    name: "Luciana F.",
    role: "Professora de Inglês · 5º ao 9º",
    quote:
      "Uso em todas as minhas turmas. A interface é clara e os materiais saem com estrutura didática de verdade.",
    badge: "Editor integrado",
    rating: 5,
  },
];

export const FINAL_BENEFITS = [
  { label: "Pagamento seguro", icon: "lock" as const },
  { label: "Acesso imediato", icon: "spark" as const },
  { label: "Créditos transparentes", icon: "checkCircle" as const },
];
