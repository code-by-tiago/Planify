import type { PlanifyIconName, PlanifyToolId, ToolCategoryId } from "@/lib/pro/planifyTools";

/** Pacote de materiais de uma “aula completa” (espelho do Construtor de Aula Teachy) */
export const lessonBundleTools: {
  id: PlanifyToolId;
  label: string;
  tag: string;
  icon: PlanifyIconName;
}[] = [
  { id: "plano-aula", label: "Plano de aula", tag: "Sala", icon: "clipboard" },
  { id: "slides", label: "Slides", tag: "Sala", icon: "presentation" },
  { id: "lista", label: "Lista de exercícios", tag: "Tarefa", icon: "listChecks" },
  { id: "atividade", label: "Atividade", tag: "Sala", icon: "puzzle" },
  { id: "resumo", label: "Resumo", tag: "Estudo", icon: "fileText" },
  { id: "mapa-mental", label: "Mapa mental", tag: "Revisão", icon: "brain" },
  { id: "prova", label: "Quiz / Prova", tag: "Avaliação", icon: "fileText" },
  { id: "jogo", label: "Jogo educativo", tag: "Engajar", icon: "puzzle" },
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
    description: "Plano, slides, atividades e avaliação no mesmo tema.",
    icon: "layers" as const,
  },
  {
    step: "3",
    title: "Revisar e exportar",
    description: "Editor, DOCX oficial e histórico do que você criou.",
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

export const teachyFeaturedToolIds: PlanifyToolId[] = [
  "plano-aula",
  "slides",
  "prova",
  "lista",
  "sequencia",
  "mapa-mental",
  "jogo",
  "redacao",
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
