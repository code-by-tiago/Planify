import type { PlanifyIconName, PlanifyToolId, ToolCategoryId } from "@/lib/pro/planifyTools";

/** Pacote de materiais de uma “aula completa” (espelho do Construtor de Aula Teachy) */
export const lessonBundleTools: {
  id: PlanifyToolId;
  label: string;
  tag: string;
  icon: PlanifyIconName;
  recommended?: boolean;
}[] = [
  { id: "plano-aula", label: "Plano de aula", tag: "Essencial · Sala", icon: "clipboard", recommended: true },
  { id: "atividade", label: "Atividade", tag: "Essencial · Sala", icon: "puzzle", recommended: true },
  { id: "lista", label: "Lista de exercícios", tag: "Essencial · Fixação", icon: "listChecks", recommended: true },
  { id: "resumo", label: "Resumo", tag: "Opcional · Estudo", icon: "fileText" },
  { id: "flashcards", label: "Flashcards", tag: "Opcional · Revisão", icon: "cards" },
  { id: "jogo", label: "Jogo educativo", tag: "Opcional · Engajar", icon: "puzzle" },
  { id: "prova", label: "Quiz / Prova", tag: "Opcional · Avaliação", icon: "fileText" },
  { id: "mapa-mental", label: "Mapa mental", tag: "Opcional · Revisão", icon: "brain" },
];

export const teachyWorkflowSteps = [
  {
    step: "1",
    title: "Criar material",
    description: "Rascunho com IA em segundos, sem prompt complexo.",
    icon: "spark" as const,
  },
  {
    step: "2",
    title: "Montar aula completa",
    description: "Plano, atividades e avaliação no mesmo tema.",
    icon: "layers" as const,
  },
  {
    step: "3",
    title: "Revisar e exportar",
    description: "Editor, Google Docs e histórico do que você criou.",
    icon: "editor" as const,
  },
  {
    step: "4",
    title: "Corrigir com IA",
    description: "Propostas de redação, listas e provas com critérios claros.",
    icon: "pen" as const,
  },
];

/** Ações rápidas no painel da ferramenta (estilo “Make it your own” Teachy) */
export const teachyQuickActions: {
  id: string;
  label: string;
  hint: string;
  objetivoSnippet: string;
}[] = [
  {
    id: "adaptar",
    label: "Adaptar acessibilidade",
    hint: "Linguagem clara e estrutura acessível",
    objetivoSnippet:
      "Adaptar para acessibilidade: frases curtas, instruções explícitas e apoio visual.",
  },
  {
    id: "facilitar",
    label: "Facilitar",
    hint: "Menor complexidade",
    objetivoSnippet:
      "Simplificar linguagem e reduzir complexidade para reforço de aprendizagem.",
  },
  {
    id: "resumir",
    label: "Resumir",
    hint: "Versão condensada",
    objetivoSnippet: "Gerar versão resumida e objetiva, mantendo os conceitos essenciais.",
  },
  {
    id: "bncc",
    label: "Alinhar BNCC",
    hint: "Competências e habilidades",
    objetivoSnippet:
      "Explicitar competências e habilidades da BNCC relacionadas ao conteúdo.",
  },
  {
    id: "cotidiano",
    label: "Exemplo real",
    hint: "Contexto do aluno",
    objetivoSnippet:
      "Incluir exemplos do cotidiano dos estudantes brasileiros.",
  },
  {
    id: "questoes",
    label: "Mais questões",
    hint: "Expandir avaliação",
    objetivoSnippet: "Incluir mais questões variadas com gabarito comentado.",
  },
];

/** Sugestões após gerar material no pacote de aula */
export const lessonBundleFollowUp: {
  toolId: PlanifyToolId;
  label: string;
}[] = [
  { toolId: "lista", label: "Lista de exercícios" },
  { toolId: "atividade", label: "Atividade em sala" },
  { toolId: "prova", label: "Quiz / Prova" },
];

export const lessonBundleObjetivoHint =
  "Montar pacote coeso de aula completa: sequência pedagógica clara, linguagem adequada ao ano, exemplos do cotidiano brasileiro e alinhamento BNCC quando aplicável.";

export const teachyFeaturedToolIds: PlanifyToolId[] = [
  "correcao-ia",
  "plano-aula",
  "prova",
  "lista",
  "atividade",
  "redacao",
  "inclusao",
];

export function isToolCategoryId(value: string | null): value is ToolCategoryId {
  return (
    value === "todos" ||
    value === "planejamento" ||
    value === "preparar-aulas" ||
    value === "avaliacoes" ||
    value === "engajar" ||
    value === "correcao"
  );
}
