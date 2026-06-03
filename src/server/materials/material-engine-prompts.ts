import type { MaterialEngineRequest, MaterialEngineType } from "./material-engine-types";

const typeLabels: Record<MaterialEngineType, string> = {
  apostila: "apostila didática",
  atividade: "atividade pedagógica",
  prova: "prova avaliativa",
  slides: "apresentação em slides",
  projeto: "projeto pedagógico",
  jogo: "jogo pedagógico",
  sequencia: "sequência didática",
  resumo: "resumo guiado",
  lista: "lista de exercícios",
  "plano-aula": "plano de aula",
  flashcards: "flashcards",
  redacao: "orientação de redação",
  "mapa-mental": "mapa mental textual",
};

function specializedRules(request: MaterialEngineRequest): string[] {
  if (request.tipoMaterial === "jogo") {
    return [
      `Formato obrigatório do jogo: ${request.formatoJogo || "jogo pedagógico"}.`,
      "Inclua regras claras, componentes do jogo e sequência de aplicação em sala.",
      "Não transformar jogo em lista de exercícios comum.",
    ];
  }

  if (request.tipoMaterial === "slides") {
    return [
      "Entregar slides com títulos curtos, bullets objetivos e notas de fala do professor.",
      "Evitar parágrafos longos no conteúdo dos slides.",
    ];
  }

  if (request.tipoMaterial === "flashcards") {
    return [
      "Gerar flashcards com frente objetiva e verso claro.",
      "Evitar respostas extensas no verso.",
    ];
  }

  if (request.tipoMaterial === "prova") {
    return [
      "Separar claramente o bloco de questões do gabarito.",
      "Incluir equilíbrio de dificuldade nas questões.",
    ];
  }

  if (request.tipoMaterial === "apostila") {
    return [
      "Estruturar por seções progressivas com explicação antes da prática.",
      "Não iniciar a apostila diretamente com questões.",
    ];
  }

  return [
    "Manter estrutura pedagógica direta e aplicável em sala.",
    "Evitar texto genérico sem utilidade prática.",
  ];
}

export function buildMaterialEngineSystemInstruction(type: MaterialEngineType): string {
  return [
    "Você é a IA pedagógica do Planify.",
    "Responda exclusivamente com JSON válido no schema fornecido.",
    `Especialidade ativa: ${typeLabels[type]}.`,
    "Não use markdown, não use bloco de código, não mencione bastidores técnicos.",
    "A entrega deve ser aplicável para professor brasileiro da Educação Básica.",
  ].join("\n");
}

export function buildMaterialEnginePrompt(request: MaterialEngineRequest): string {
  const rules = specializedRules(request)
    .map((rule) => `- ${rule}`)
    .join("\n");

  return `
Gere material pedagógico para o Planify com qualidade profissional.

TIPO:
- Tipo técnico: ${request.tipoMaterial}
- Tipo pedagógico: ${typeLabels[request.tipoMaterial]}

DADOS DA SOLICITAÇÃO:
- Tema: ${request.tema}
- Etapa: ${request.etapa}
- Ano/Série: ${request.anoSerie}
- Componente curricular: ${request.componenteCurricular}
- Objetivo do professor: ${request.objetivo || "Não informado"}
- Quantidade desejada: ${request.quantidade}
- Dificuldade: ${request.dificuldade}
- Incluir gabarito: ${request.incluirGabarito ? "sim" : "não"}

REGRAS ESPECIALIZADAS:
${rules}

REGRAS GERAIS:
- Adequar linguagem ao ano/série.
- Entregar conteúdo coeso, sem repetição e sem preenchimento artificial.
- Entregar pronto para edição no editor do Planify.
- Entregar somente JSON no schema.
`.trim();
}
