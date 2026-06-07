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
      "No editor, conecte o Google e envie o material à turma — DOCX no Drive e atividade criada automaticamente. Também compartilhe com outros professores no Marketplace.",
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
    "A única ferramenta que adapta materiais para as necessidades específicas de cada aluno de forma humanizada.",
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

export type LandingTestimonial = {
  name: string;
  quote: string;
  role: string;
  school: string;
  initials: string;
  accent: string;
};

export const teachyLandingTestimonials: LandingTestimonial[] = [
  {
    name: "Luciano Legi",
    role: "Professor de História",
    school: "Ensino Médio · SP",
    initials: "LL",
    accent: "from-indigo-500 to-violet-600",
    quote:
      "Com o Planify, melhorei minha qualidade de vida porque agora não passo horas fazendo listas, provas e planejamentos. Tudo que preciso é descrever o tema e pronto.",
  },
  {
    name: "Ana Paula Germano",
    role: "Professora de Português",
    school: "Rede pública · MG",
    initials: "AP",
    accent: "from-sky-500 to-indigo-600",
    quote:
      "Antes eu estava exausta e cheguei a pensar em desistir. Hoje tenho tempo para minha família e materiais alinhados à BNCC em minutos.",
  },
  {
    name: "Luiza M.",
    role: "Coordenadora pedagógica",
    school: "Ensino Fundamental · RJ",
    initials: "LM",
    accent: "from-fuchsia-500 to-rose-500",
    quote:
      "Não consigo mais viver sem a plataforma. Espalhei a novidade para todos os colegas — virou parte da rotina da escola.",
  },
  {
    name: "Rafael Lima",
    role: "Professor de Matemática",
    school: "Colégio particular · PR",
    initials: "RL",
    accent: "from-emerald-500 to-teal-600",
    quote:
      "As provas saem com gabarito e no padrão da escola. O editor me deixa ajustar tudo antes de exportar em DOCX.",
  },
  {
    name: "Pepsy Penom Audu",
    role: "Professora de Ciências",
    school: "Ensino Fundamental II",
    initials: "PP",
    accent: "from-amber-500 to-orange-500",
    quote:
      "A plataforma torna o aprendizado mágico. Criei aulas práticas envolventes que encantam meus alunos.",
  },
  {
    name: "Nokulunga Mdladla",
    role: "Professora de Geografia",
    school: "Ensino Médio",
    initials: "NM",
    accent: "from-cyan-500 to-blue-600",
    quote:
      "Otimizei meu planejamento, criei atividades envolventes e gerei materiais para meus alunos com facilidade.",
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
  "DOCX oficial",
  `${landingGeneratorCount} ferramentas IA`,
  "Marketplace",
  "Editor integrado",
];
