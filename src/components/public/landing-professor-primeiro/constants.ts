export const HERO_SHOWCASE_CARDS = [
  {
    id: "planejamento",
    src: "/marketing/hero-cards/planejamento-bncc.png",
    alt: "Planejamento BNCC em minutos - matriz anual pronta para exportar",
  },
  {
    id: "provas",
    src: "/marketing/hero-cards/provas-google-forms.png",
    alt: "Provas prontas no Google Forms integradas ao Classroom",
  },
  {
    id: "atividades",
    src: "/marketing/hero-cards/atividades-ludicas.png",
    alt: "Atividades lúdicas em segundos - cruzadinhas e jogos pedagógicos",
  },
  {
    id: "pei",
    src: "/marketing/hero-cards/pei-inclusao.png",
    alt: "Documentos de inclusão - PEI detalhado e alinhado à BNCC",
  },
] as const;

export const TRUST_ITEMS = [
  { label: "Alinhado à BNCC", icon: "checkCircle" as const },
  { label: "Google Drive", googleProduct: "drive" as const },
  { label: "Editor integrado", icon: "editor" as const },
  { label: "Google Classroom", googleProduct: "classroom" as const },
];

export const RESOURCES = [
  {
    title: "BNCC local",
    description:
      "Habilidades sugeridas conforme etapa, ano/série e componente - com base na matriz curricular, para você revisar.",
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
      "Envie ao Google Docs, salve no Drive e publique no Classroom após revisar.",
    icon: "download" as const,
  },
];

export const INTEGRATION_FEATURES = [
  {
    title: "Integração com Google Workspace",
    description:
      "Serviço de exportação para Google Docs, Google Drive e abertura segura do Google Classroom.",
  },
  {
    title: "Onboarding e Treinamento Institucional",
    description:
      "Implementação assistida e treinamento dedicado para escolas que adotam a plataforma em nível corporativo.",
  },
] as const;

export const FINAL_BENEFITS = [
  { label: "Pagamento seguro", icon: "lock" as const },
  { label: "Acesso imediato", icon: "spark" as const },
  { label: "Uso ilimitado", icon: "checkCircle" as const },
];
