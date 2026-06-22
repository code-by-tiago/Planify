import type { PlanifyIconName } from "@/lib/pro/planifyTools";
import { planifyToolCount } from "@/lib/pro/planifyTools";

/** Fluxo principal da landing Teachy (professores) — textos adaptados ao Planify */
export const teachyHomeFeatures: {
  title: string;
  description: string;
  cta: string;
  href: string;
  icon: PlanifyIconName;
  imageSide: "left" | "right";
}[] = [
  {
    title: "Crie o material perfeito",
    description:
      "O primeiro rascunho pronto em segundos. Adicione seu toque e refine em minutos com IA — slides, listas, planos e resumos alinhados à BNCC.",
    cta: "Ver planos",
    href: "/planos",
    icon: "spark",
    imageSide: "right",
  },
  {
    title: "Crie uma aula inteira baseada nisso",
    description:
      "Transforme seu tema em uma aula completa com plano, slides, atividades e avaliação — tudo coeso no Construtor de aula.",
    cta: "Ver planos",
    href: "/planos",
    icon: "layers",
    imageSide: "left",
  },
  {
    title: "Publique na turma do Classroom",
    description:
      "No editor, conecte o Google e envie o material à turma — documento no Drive e atividade criada automaticamente. Também compartilhe com outros professores na Comunidade.",
    cta: "Abrir editor",
    href: "/dashboard?secao=editor",
    icon: "externalLink",
    imageSide: "right",
  },
  {
    title: "Monte propostas de redação",
    description:
      "Gere tema, textos motivadores, comando e critérios de avaliação alinhados à matriz ENEM ou escolar — pronto para aplicar na turma.",
    cta: "Gerar redação",
    href: "/dashboard?tipo=redacao",
    icon: "pen",
    imageSide: "left",
  },
];

/** Destaque de inclusão na landing (card estilo Passo 4) */
export const teachyInclusionFeature = {
  title: "Educação inclusiva ao alcance de um clique",
  description:
    "Adapte materiais para necessidades específicas de cada aluno — rotinas visuais, textos objetivos e formatação acessível.",
  cta: "Adaptar material",
  href: "/dashboard?tipo=inclusao",
  bullets: [
    {
      icon: "puzzle" as PlanifyIconName,
      label: "TEA (Autismo)",
      text: "Rotinas visuais e comandos claros",
    },
    {
      icon: "listChecks" as PlanifyIconName,
      label: "TDAH",
      text: "Textos objetivos, tópicos destacados e exercícios focados",
    },
    {
      icon: "fileText" as PlanifyIconName,
      label: "Dislexia e Baixa Visão",
      text: "Formatação limpa e suporte a fontes amigáveis",
    },
  ],
};

/** Ferramentas extras na landing pública (fora dos geradores do painel). */
export const landingExtraTools: {
  id: string;
  shortTitle: string;
  description: string;
  href: string;
  icon: PlanifyIconName;
  accent: string;
}[] = [
  {
    id: "planejamentos",
    shortTitle: "Planejamentos",
    description:
      "Matriz anual ou trimestral com habilidades BNCC locais, modelos oficiais em DOCX e exportação Google — você revisa cada campo.",
    href: "/planejamento-escolar-com-ia",
    icon: "clipboard",
    accent: "from-blue-500 to-blue-600",
  },
];

export const teachyTrustSchools = [
  "Ensino Fundamental",
  "Ensino Médio",
  "Educação Infantil",
  "Matemática",
  "Língua Portuguesa",
  "Ciências",
  "História",
  "Geografia",
  "Rede pública",
  "Rede privada",
];

/** Cards de planejamento na grade pública (#ferramentas) */
export const landingPlanejamentoTools: {
  id: string;
  shortTitle: string;
  href: string;
  icon: PlanifyIconName;
  accent: string;
}[] = [
  {
    id: "planejamento-anual",
    shortTitle: "Plano Anual",
    href: "/dashboard?secao=planejamentos&matriz=anual",
    icon: "clipboard",
    accent: "from-blue-500 to-blue-600",
  },
  {
    id: "planejamento-trimestral",
    shortTitle: "Plano Trimestral",
    href: "/dashboard?secao=planejamentos&matriz=trimestral",
    icon: "calendar",
    accent: "from-sky-500 to-blue-500",
  },
];

/** Geradores de material na grade pública (sem contar planejamentos). */
export const landingGeneratorCount = planifyToolCount;

/** Total de cards na landing (#ferramentas): geradores + plano anual/trimestral. */
export const landingPublicToolCount =
  planifyToolCount + landingPlanejamentoTools.length;

export const teachyPartnerLabels = [
  "BNCC",
  "Google Classroom",
  "Google Slides",
  "Modelo oficial",
  `${landingGeneratorCount} ferramentas IA`,
  "Comunidade",
  "Editor integrado",
];
