import type { QuestionBankItem } from "@/types/question-bank";

export { extractQuestionsFromMaterialOutput } from "@/lib/banco-questoes/question-bank-extract";

/** Curadoria inicial da comunidade — exemplos públicos para busca e remix. */
export const COMMUNITY_QUESTION_SEEDS: QuestionBankItem[] = [
  {
    id: "community-hist-5-ef01",
    enunciado:
      "Leia o trecho: «As vilas do Brasil colonial dependiam do trabalho escravizado.» Explique uma consequência social dessa organização para a sociedade atual.",
    tipo: "discursiva",
    alternativas: [],
    respostaEsperada:
      "Resposta esperada: reconhecer heranças de desigualdade, racismo estrutural ou concentração de renda ligada à escravidão.",
    criterioCorrecao: "Avaliar compreensão histórica e capacidade de relacionar passado e presente.",
    componente: "História",
    anoSerie: "5º ano",
    etapa: "Ensino Fundamental",
    tema: "Brasil colonial",
    bnccCodigos: ["EF05HI06"],
    tags: ["colonial", "sociedade"],
    isCommunity: true,
    authorName: "Planify Curadoria",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "community-mat-6-ef02",
    enunciado:
      "Uma pizza foi dividida em 8 partes iguais. Pedro comeu 3 partes. Qual fração representa o que Pedro comeu?",
    tipo: "objetiva",
    alternativas: ["1/8", "3/8", "5/8", "3/5"],
    respostaEsperada: "3/8",
    criterioCorrecao: "Verificar identificação correta de fração de um todo.",
    componente: "Matemática",
    anoSerie: "6º ano",
    etapa: "Ensino Fundamental",
    tema: "Frações",
    bnccCodigos: ["EF06MA07"],
    tags: ["frações", "cotidiano"],
    isCommunity: true,
    authorName: "Planify Curadoria",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "community-port-9-ef03",
    enunciado:
      "Identifique a função da linguagem predominante no cartaz: «PARE! Respeite a faixa de pedestres.»",
    tipo: "objetiva",
    alternativas: ["Poética", "Referencial", "Emotiva", "Metalinguística"],
    respostaEsperada: "Emotiva",
    criterioCorrecao: "Avaliar reconhecimento de função emotiva/apelo.",
    componente: "Língua Portuguesa",
    anoSerie: "9º ano",
    etapa: "Ensino Fundamental",
    tema: "Funções da linguagem",
    bnccCodigos: ["EF69LP31"],
    tags: ["linguagem", "cartaz"],
    isCommunity: true,
    authorName: "Planify Curadoria",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
  },
];
