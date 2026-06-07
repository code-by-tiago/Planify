/** Número comercial WhatsApp — configure NEXT_PUBLIC_WHATSAPP_COMMERCIAL (ex.: 5511999999999). */
export function getCommercialWhatsAppNumber(): string {
  const raw = process.env.NEXT_PUBLIC_WHATSAPP_COMMERCIAL?.trim();
  const digits = raw?.replace(/\D/g, "") ?? "";
  return digits.length >= 10 ? digits : "5511999999999";
}

export function buildCommercialWhatsAppUrl(message: string): string {
  return `https://wa.me/${getCommercialWhatsAppNumber()}?text=${encodeURIComponent(message)}`;
}

export type InstitutionalPlan = {
  key: string;
  name: string;
  teacherLimit: string;
  priceLabel: string;
  priceNote: string;
  description: string;
  highlighted?: boolean;
  features: string[];
};

export const institutionalPlans: InstitutionalPlan[] = [
  {
    key: "pequena",
    name: "Pequena Escola",
    teacherLimit: "Até 15 professores",
    priceLabel: "R$ 14.900",
    priceNote: "/ ano",
    description:
      "Ideal para escolas de ensino básico com equipe docente enxuta e necessidade de visibilidade pedagógica centralizada.",
    features: [
      "Portal exclusivo do gestor",
      "Painel BNCC por turma",
      "Relatórios de conformidade",
      "Licenciamento por e-mail",
      "Suporte comercial dedicado",
    ],
  },
  {
    key: "media",
    name: "Média Escola",
    teacherLimit: "Até 40 professores",
    priceLabel: "R$ 34.900",
    priceNote: "/ ano",
    description:
      "Para instituições em expansão que precisam escalar acompanhamento pedagógico sem aumentar a burocracia da coordenação.",
    highlighted: true,
    features: [
      "Tudo do plano Pequena Escola",
      "Auditoria em tempo real ampliada",
      "Métricas de produtividade docente",
      "Onboarding institucional assistido",
      "Prioridade no suporte comercial",
    ],
  },
  {
    key: "grande",
    name: "Grande Escola",
    teacherLimit: "40+ professores",
    priceLabel: "Sob consulta",
    priceNote: "anual",
    description:
      "Solução corporativa para redes e colégios de grande porte, com volume elevado de licenças e integração sob medida.",
    features: [
      "Tudo do plano Média Escola",
      "Volume ilimitado de professores",
      "Acordo comercial personalizado",
      "Implementação e treinamento",
      "Contato direto com consultor sênior",
    ],
  },
];

export type EscolasLeadForm = {
  nomeGestor: string;
  nomeEscola: string;
  email: string;
  telefone: string;
  numeroProfessores: string;
};

export function buildEscolasLeadWhatsAppMessage(form: EscolasLeadForm): string {
  return [
    "Olá, equipe comercial Planify.",
    "",
    "Gostaria de solicitar informações sobre o plano institucional para escolas.",
    "",
    `Gestor(a): ${form.nomeGestor}`,
    `Escola: ${form.nomeEscola}`,
    `E-mail: ${form.email}`,
    `Telefone: ${form.telefone}`,
    `Número de professores: ${form.numeroProfessores}`,
  ].join("\n");
}

export function buildPlanInquiryWhatsAppMessage(planName: string): string {
  return [
    "Olá, equipe comercial Planify.",
    "",
    `Tenho interesse no plano institucional *${planName}* para minha escola.`,
    "Gostaria de agendar uma demonstração e receber uma proposta.",
  ].join("\n");
}
