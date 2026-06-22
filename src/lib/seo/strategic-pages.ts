import type { PlanifyIconName } from "@/lib/pro/planifyTools";

export type StrategicPageContent = {
  path: string;
  title: string;
  description: string;
  eyebrow: string;
  h1: string;
  h1Accent: string;
  lead: string;
  benefits: Array<{
    icon: PlanifyIconName;
    title: string;
    description: string;
  }>;
  steps: Array<{
    step: number;
    title: string;
    description: string;
  }>;
  relatedLinks: Array<{ href: string; label: string }>;
};

export const STRATEGIC_PAGES: StrategicPageContent[] = [
  {
    path: "/planejamento-escolar-com-ia",
    title: "Planejamento escolar com IA",
    description:
      "Crie planejamentos anuais, trimestrais e de aula alinhados à BNCC com IA pedagógica. Revise, edite e exporte ao Google Docs no Planify.",
    eyebrow: "Planejamento pedagógico",
    h1: "Planejamento escolar com IA",
    h1Accent: "alinhado à BNCC",
    lead: "Estruture planejamentos anuais, trimestrais e de aula com sugestões de habilidades, sequência didática e objetivos — prontos para revisar no editor e exportar ao Google Docs.",
    benefits: [
      {
        icon: "clipboard",
        title: "Planejamentos por período",
        description:
          "Organize o ano letivo, trimestres ou aulas individuais com estrutura pedagógica consistente.",
      },
      {
        icon: "checkCircle",
        title: "BNCC integrada",
        description:
          "Receba sugestões de habilidades conforme etapa, ano/série e componente curricular.",
      },
      {
        icon: "download",
        title: "Exportação Google Docs",
        description:
          "Finalize no editor integrado e exporte documentos com formatação profissional.",
      },
    ],
    steps: [
      {
        step: 1,
        title: "Defina etapa e componente",
        description: "Informe disciplina, série, tema e objetivos da aula ou período.",
      },
      {
        step: 2,
        title: "Gere a estrutura com IA",
        description: "O Planify propõe sequência didática, habilidades BNCC e atividades.",
      },
      {
        step: 3,
        title: "Revise e exporte",
        description: "Ajuste no editor, salve no histórico e exporte ao Google Docs quando estiver pronto.",
      },
    ],
    relatedLinks: [
      { href: "/gerador-de-atividades-com-ia", label: "Gerador de atividades" },
      { href: "/editor-de-documentos-para-professores", label: "Editor de documentos" },
    ],
  },
  {
    path: "/gerador-de-atividades-com-ia",
    title: "Gerador de atividades com IA",
    description:
      "Crie atividades didáticas, exercícios e tarefas alinhadas à BNCC com IA. Personalize no editor e exporte ao Google Docs no Planify.",
    eyebrow: "Atividades didáticas",
    h1: "Gerador de atividades com IA",
    h1Accent: "para sala de aula",
    lead: "Produza atividades, listas de exercícios e tarefas com linguagem adequada à etapa e ao componente — revise antes de aplicar com seus alunos.",
    benefits: [
      {
        icon: "puzzle",
        title: "Variedade de formatos",
        description:
          "Atividades dissertativas, objetivas, resolução de problemas e propostas de aplicação em sala.",
      },
      {
        icon: "checkCircle",
        title: "Contexto pedagógico",
        description:
          "A IA considera etapa, série, tema e objetivos que você informar no fluxo de criação.",
      },
      {
        icon: "editor",
        title: "Editor integrado",
        description:
          "Ajuste enunciados, pontuação e instruções sem sair da plataforma.",
      },
    ],
    steps: [
      {
        step: 1,
        title: "Descreva a atividade",
        description: "Escolha o tipo, tema, quantidade de questões e nível de complexidade.",
      },
      {
        step: 2,
        title: "Gere e revise",
        description: "Receba a proposta estruturada e adapte ao perfil da turma no editor.",
      },
      {
        step: 3,
        title: "Exporte ou publique",
        description: "Exporte ao Google Docs ou use integrações Google quando disponíveis na sua conta.",
      },
    ],
    relatedLinks: [
      { href: "/gerador-de-provas-com-ia", label: "Gerador de provas" },
      { href: "/planejamento-escolar-com-ia", label: "Planejamento escolar" },
    ],
  },
  {
    path: "/gerador-de-provas-com-ia",
    title: "Gerador de provas com IA",
    description:
      "Monte provas e avaliações alinhadas à BNCC com IA pedagógica. Edite questões, gabarito e exporte ao Google Docs no Planify.",
    eyebrow: "Avaliações",
    h1: "Gerador de provas com IA",
    h1Accent: "com gabarito e revisão",
    lead: "Estruture provas com questões, instruções e gabarito sugerido. Você mantém controle total sobre o conteúdo antes de aplicar a avaliação.",
    benefits: [
      {
        icon: "listChecks",
        title: "Provas estruturadas",
        description:
          "Enunciados, alternativas ou questões dissertativas organizados em formato pronto para revisão.",
      },
      {
        icon: "checkCircle",
        title: "Alinhamento curricular",
        description:
          "Informe habilidades e conteúdos para orientar a geração conforme sua aula.",
      },
      {
        icon: "download",
        title: "Google Docs para impressão",
        description:
          "Exporte com layout adequado para impressão ou compartilhamento com a coordenação.",
      },
    ],
    steps: [
      {
        step: 1,
        title: "Configure a prova",
        description: "Defina disciplina, tema, quantidade de questões e formato desejado.",
      },
      {
        step: 2,
        title: "Gere a avaliação",
        description: "A IA monta a estrutura; você revisa cada questão e o gabarito sugerido.",
      },
      {
        step: 3,
        title: "Finalize e exporte",
        description: "Salve no histórico, ajuste no editor e exporte ao Google Docs oficial.",
      },
    ],
    relatedLinks: [
      { href: "/gerador-de-atividades-com-ia", label: "Gerador de atividades" },
      { href: "/editor-de-documentos-para-professores", label: "Editor de documentos" },
    ],
  },
  {
    path: "/editor-de-documentos-para-professores",
    title: "Editor de documentos para professores",
    description:
      "Revise e finalize planejamentos, provas e materiais didáticos no editor integrado do Planify com exportação Google Docs.",
    eyebrow: "Editor integrado",
    h1: "Editor de documentos para professores",
    h1Accent: "revise e exporte",
    lead: "Centralize a revisão dos materiais gerados com IA — ajuste texto, estrutura e formatação antes de exportar ao Google Docs ou usar em sala.",
    benefits: [
      {
        icon: "editor",
        title: "Um fluxo contínuo",
        description:
          "Gere com IA e edite no mesmo painel, sem copiar entre ferramentas externas.",
      },
      {
        icon: "history",
        title: "Histórico de versões",
        description:
          "Acesse materiais anteriores e retome edições quando precisar atualizar conteúdo.",
      },
      {
        icon: "download",
        title: "Exportação Google Docs",
        description:
          "Baixe documentos com padrão profissional para impressão ou envio à coordenação.",
      },
    ],
    steps: [
      {
        step: 1,
        title: "Gere ou abra um material",
        description: "Crie com os geradores IA ou abra um item salvo no histórico.",
      },
      {
        step: 2,
        title: "Edite com controle",
        description: "Ajuste seções, enunciados, formatação e observações pedagógicas.",
      },
      {
        step: 3,
        title: "Exporte ou publique",
        description: "Exporte ao Google Docs ou use integrações Google disponíveis na sua conta.",
      },
    ],
    relatedLinks: [
      { href: "/planejamento-escolar-com-ia", label: "Planejamento escolar" },
      { href: "/gerador-de-provas-com-ia", label: "Gerador de provas" },
    ],
  },
];

/** Páginas estratégicas exibidas na landing (exclui ferramentas desativadas). */
const HIDDEN_STRATEGIC_PATHS = new Set([
  "/gerador-de-jogos-pedagogicos",
  "/apostilas-com-ia-para-professores",
]);

export const PUBLIC_STRATEGIC_PAGES = STRATEGIC_PAGES.filter(
  (page) => !HIDDEN_STRATEGIC_PATHS.has(page.path),
);

export function getStrategicPageByPath(path: string): StrategicPageContent | undefined {
  return STRATEGIC_PAGES.find((page) => page.path === path);
}
