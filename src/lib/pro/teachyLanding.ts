import type { PlanifyIconName } from "@/lib/pro/planifyTools";

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
    cta: "Experimente agora",
    href: "/dashboard",
    icon: "spark",
    imageSide: "right",
  },
  {
    title: "Crie uma aula inteira baseada nisso",
    description:
      "Transforme seu tema em uma aula completa com plano, slides, atividades e avaliação — tudo coeso no Construtor de aula.",
    cta: "Experimente agora",
    href: "/planejamentos",
    icon: "layers",
    imageSide: "left",
  },
  {
    title: "Publique na turma do Classroom",
    description:
      "No editor, conecte o Google e envie o material à turma — DOCX no Drive e atividade criada automaticamente. Também compartilhe com outras professoras no Marketplace.",
    cta: "Abrir editor",
    href: "/dashboard?secao=editor",
    icon: "externalLink",
    imageSide: "right",
  },
  {
    title: "Corrija automaticamente",
    description:
      "Recupere seus fins de semana. Use o corretor de redação com devolutiva orientada e critérios pedagógicos claros.",
    cta: "Experimente agora",
    href: "/materiais?tipo=redacao",
    icon: "pen",
    imageSide: "left",
  },
];

export const teachyLandingTestimonials = [
  {
    name: "Luciano Legi",
    quote:
      "Com o Planify, melhorei minha qualidade de vida porque agora não passo horas fazendo listas, provas e planejamentos. Tudo que preciso é descrever o tema e pronto.",
  },
  {
    name: "Ana Paula Germano",
    quote:
      "Antes eu estava exausta e cheguei a pensar em desistir. Hoje tenho tempo para minha família e materiais alinhados à BNCC em minutos.",
  },
  {
    name: "Luiza",
    quote:
      "Não consigo mais viver sem a plataforma. Espalhei a novidade para todos os colegas — virou parte da rotina da escola.",
  },
  {
    name: "Pepsy Penom Audu",
    quote:
      "A plataforma torna o aprendizado mágico. Criei aulas práticas envolventes que encantam meus alunos.",
  },
  {
    name: "Rafael Lima",
    quote:
      "As provas saem com gabarito e no padrão da escola. O editor me deixa ajustar tudo antes de exportar em DOCX.",
  },
  {
    name: "Nokulunga Mdladla",
    quote:
      "Otimizei meu planejamento, criei palavras cruzadas envolventes e gerei atividades para meus alunos com facilidade.",
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

export const teachyPartnerLabels = [
  "BNCC",
  "Google Classroom",
  "DOCX oficial",
  "13 ferramentas IA",
  "Marketplace",
  "Editor integrado",
];
