import { planifyTools } from "@/lib/pro/planifyTools";
import { landingExtraTools } from "@/lib/pro/teachyLanding";

function toolAccent(id: string) {
  return (
    planifyTools.find((tool) => tool.id === id)?.accent ??
    "from-slate-400 to-slate-500"
  );
}

const planejamentosAccent =
  landingExtraTools.find((tool) => tool.id === "planejamentos")?.accent ??
  "from-blue-500 to-blue-600";

export const HERO_SHOWCASE_CARDS = [
  {
    id: "planejamento",
    src: "/marketing/hero-cards/planejamento-bncc.png",
    alt: "Planejamento BNCC em minutos — matriz anual pronta para exportar",
  },
  {
    id: "provas",
    src: "/marketing/hero-cards/provas-google-forms.png",
    alt: "Provas prontas no Google Forms integradas ao Classroom",
  },
  {
    id: "atividades",
    src: "/marketing/hero-cards/atividades-ludicas.png",
    alt: "Atividades lúdicas em segundos — cruzadinhas e jogos pedagógicos",
  },
  {
    id: "pei",
    src: "/marketing/hero-cards/pei-inclusao.png",
    alt: "Documentos de inclusão — PEI detalhado e alinhado à BNCC",
  },
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
    accent: planejamentosAccent,
  },
  {
    id: "prova",
    label: "Prova",
    icon: "listChecks" as const,
    href: "/gerador-de-provas-com-ia",
    accent: toolAccent("prova"),
  },
  {
    id: "lista",
    label: "Lista de exercícios",
    icon: "listChecks" as const,
    href: "/login",
    accent: toolAccent("lista"),
  },
  {
    id: "plano-aula",
    label: "Plano de aula",
    icon: "layers" as const,
    href: "/login",
    accent: toolAccent("plano-aula"),
  },
  {
    id: "atividades",
    label: "Atividades",
    icon: "puzzle" as const,
    href: "/gerador-de-atividades-com-ia",
    accent: toolAccent("atividade"),
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

export const INTEGRATION_FEATURES = [
  {
    title: "Integração com Google Workspace",
    description:
      "Serviço de exportação direta de materiais para Google Docs, Google Drive e envio de atividades para o Google Classroom.",
  },
  {
    title: "Onboarding e Treinamento Institucional",
    description:
      "Implementação assistida e treinamento dedicado para escolas que adotam a plataforma em nível corporativo.",
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
  { label: "Uso ilimitado", icon: "checkCircle" as const },
];
