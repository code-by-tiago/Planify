import type { MaterialContentSuggestionInput } from "../../../types/ai";

export function buildMaterialContentSuggestionSystemInstruction(): string {
  return [
    "Você é uma IA pedagógica especialista em currículo, didática e criação de materiais para professores brasileiros.",
    "Você trabalha para o SaaS Planify.",
    "Sua tarefa é sugerir conteúdos inteligentes, objetivos e formatos de material a partir de etapa, série, componente e tema central.",
    "As sugestões precisam ser específicas, aplicáveis e coerentes com o tema do professor.",
    "Não gere códigos BNCC nesta resposta.",
    "Não use markdown.",
    "Não use bloco de código.",
    "Retorne exclusivamente JSON válido.",
  ].join("\n");
}

export function buildMaterialContentSuggestionPrompt(input: MaterialContentSuggestionInput): string {
  return `
Sugira conteúdos inteligentes para o Gerador de Materiais Didáticos do Planify.

DADOS:
Etapa: ${input.etapa}
Ano/Série: ${input.anoSerie}
Área do conhecimento: ${input.areaConhecimento || "Não informado"}
Componente curricular: ${input.componenteCurricular}
Tema central: ${input.tema}
Tipo pretendido: ${input.tipo || "Não informado"}
Modelo de jogo pretendido: ${input.modeloJogo || "Não informado"}
Quantidade desejada: ${input.quantidade || "6"}
Observações do professor: ${input.observacoes || "Não informado"}

REGRAS:
1. Sugira de 5 a 8 conteúdos realmente compatíveis com o tema, componente, etapa e ano/série.
2. Não use termos genéricos como apenas "conceito", "exemplo", "leitura" ou "cultura" se eles não estiverem contextualizados.
3. Cada conteúdo deve ter título, descrição, palavras-chave, objetivos, dificuldade, tempo estimado e justificativa pedagógica.
4. As palavras-chave devem alimentar jogos visuais como cruzadinha, caça-palavras, bingo, memória, dominó, quiz e cartas.
5. Para Ensino Religioso e tema Jó, por exemplo, use conteúdos ligados à narrativa de Jó, fidelidade, paciência, sofrimento, esperança, provação, integridade, confiança e restauração.
6. Para Língua Espanhola, sugira conteúdos de vocabulário, comunicação, leitura, diálogos, cultura hispânica, países hispânicos e diversidade linguística quando fizer sentido.
7. Para jogos, recomende os modelos mais adequados ao tema e diga o motivo.
8. Não invente informações sensíveis, não crie doutrinação e mantenha abordagem pedagógica respeitosa.
9. Retorne somente JSON válido.

FORMATO JSON EXATO:
{
  "tema": "string",
  "etapa": "string",
  "anoSerie": "string",
  "areaConhecimento": "string",
  "componenteCurricular": "string",
  "resumoPedagogico": "string",
  "conteudos": [
    {
      "id": "c1",
      "titulo": "string",
      "descricao": "string",
      "palavrasChave": ["string"],
      "objetivos": ["string"],
      "dificuldade": "Básico | Intermediário | Avançado",
      "tempoEstimado": "string",
      "justificativaPedagogica": "string"
    }
  ],
  "objetivosGerais": ["string"],
  "palavrasChaveGerais": ["string"],
  "materiaisRecomendados": [
    {
      "tipo": "atividade | prova | apostila | sequencia | jogo | projeto | roteiro",
      "modeloJogo": "caca_palavras | cruzadinha | bingo | memoria | domino | quiz | cartas | não se aplica",
      "titulo": "string",
      "motivo": "string"
    }
  ],
  "jogosRecomendados": [
    {
      "tipo": "jogo",
      "modeloJogo": "caca_palavras | cruzadinha | bingo | memoria | domino | quiz | cartas",
      "titulo": "string",
      "motivo": "string"
    }
  ],
  "observacoesDeUso": ["string"],
  "alertas": ["string"]
}
`.trim();
}
