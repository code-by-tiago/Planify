import type { PlanifyToolId } from "@/lib/pro/planifyTools";

const MATERIAL_STEPS: Partial<Record<PlanifyToolId, string[]>> = {
  prova: [
    "Gerando sua prova...",
    "Equilibrando questões objetivas e discursivas...",
    "Montando gabarito e critérios de correção...",
    "Preparando material para edição...",
  ],
  lista: [
    "Gerando sua lista de exercícios...",
    "Organizando progressão de dificuldade...",
    "Consolidando gabarito comentado...",
    "Preparando material para edição...",
  ],
  apostila: [
    "Gerando sua apostila...",
    "Organizando capítulos e explicações...",
    "Incluindo exemplos e atividades de fixação...",
    "Preparando material para edição...",
  ],
  atividade: [
    "Gerando sua atividade...",
    "Ajustando linguagem para a série informada...",
    "Organizando enunciado, desenvolvimento e avaliação...",
    "Preparando material para edição...",
  ],
  slides: [
    "Gerando sua apresentação...",
    "Organizando sequência pedagógica da aula...",
    "Preparando slides e notas do professor...",
    "Preparando material para edição...",
  ],
  "plano-aula": [
    "Gerando seu plano de aula...",
    "Distribuindo etapas e tempos...",
    "Alinhando objetivos e avaliação formativa...",
    "Preparando material para edição...",
  ],
  sequencia: [
    "Gerando sua sequência didática...",
    "Encadeando aulas e avaliações...",
    "Revisando progressão pedagógica...",
    "Preparando material para edição...",
  ],
  projeto: [
    "Gerando seu projeto pedagógico...",
    "Organizando fases, tarefas e produto final...",
    "Definindo critérios de avaliação...",
    "Preparando material para edição...",
  ],
  jogo: [
    "Gerando seu jogo pedagógico...",
    "Montando regras e componentes aplicáveis em sala...",
    "Revisando coerência com o tema...",
    "Preparando material para edição...",
  ],
  resumo: [
    "Gerando seu resumo...",
    "Organizando tópicos e síntese...",
    "Incluindo perguntas de fixação...",
    "Preparando material para edição...",
  ],
  redacao: [
    "Gerando proposta de redação...",
    "Selecionando textos motivadores...",
    "Definindo critérios de avaliação...",
    "Preparando material para edição...",
  ],
  flashcards: [
    "Gerando seus flashcards...",
    "Equilibrando perguntas e respostas...",
    "Revisando clareza dos conceitos...",
    "Preparando material para edição...",
  ],
  "mapa-mental": [
    "Gerando seu mapa mental...",
    "Organizando conceito central e ramos...",
    "Conectando subtópicos ao tema...",
    "Preparando material para edição...",
  ],
  "aula-completa": [
    "Montando seu pacote de aula completa...",
    "Gerando plano, slides, atividade e avaliação...",
    "Alinhando linguagem e progressão entre materiais...",
    "Preparando pré-visualização do pacote...",
  ],
  "correcao-ia": [
    "Analisando a resposta do estudante...",
    "Aplicando rubrica e critérios pedagógicos...",
    "Preparando devolutiva personalizada...",
    "Finalizando nota e feedback...",
  ],
};

const DEFAULT_MATERIAL_STEPS = [
  "Gerando seu material...",
  "Organizando estrutura pedagógica...",
  "Revisando coerência do conteúdo...",
  "Preparando material para edição...",
];

export function getMaterialGenerationSteps(
  toolId?: PlanifyToolId | string,
): string[] {
  if (!toolId) return DEFAULT_MATERIAL_STEPS;
  return MATERIAL_STEPS[toolId as PlanifyToolId] ?? DEFAULT_MATERIAL_STEPS;
}
