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

export const TESTIMONIALS = [
  {
    name: "Juliana A.",
    role: "Professora de Língua Portuguesa · 8º ano",
    quote:
      "Reduzi de horas para minutos o planejamento anual. A BNCC vem sugerida e eu só adapto ao meu contexto.",
  },
  {
    name: "Carlos M.",
    role: "Professor de História · Ensino Médio",
    quote:
      "As provas e slides saem estruturados. Exporto em DOCX e já uso na aula no mesmo dia.",
  },
  {
    name: "Patrícia S.",
    role: "Coordenadora pedagógica",
    quote:
      "A equipe ganhou consistência nos planejamentos. Tudo alinhado à BNCC e fácil de revisar.",
  },
  {
    name: "Ricardo T.",
    role: "Professor de Matemática · 6º ao 9º",
    quote:
      "O editor integrado mudou meu fluxo. Gero, ajusto e publico no Classroom sem sair do Planify.",
  },
];

export const FINAL_BENEFITS = [
  { label: "Pagamento seguro", icon: "lock" as const },
  { label: "Acesso imediato", icon: "spark" as const },
  { label: "Créditos transparentes", icon: "checkCircle" as const },
];
