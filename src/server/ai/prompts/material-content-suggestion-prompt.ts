import type { MaterialContentSuggestionInput } from "../../../types/ai";

export function buildMaterialContentSuggestionSystemInstruction(): string {
  return [
    "Você é uma IA pedagógica especialista em currículo, didática e criação de materiais para professores brasileiros.",
    "Você trabalha para o Planify, uma plataforma educacional premium para professores.",
    "Sua tarefa é montar um mapa pedagógico interno, invisível como fluxo de escolha, a partir de etapa, série, componente e tema central.",
    "Os blocos do mapa precisam ser específicos, aplicáveis e coerentes com o tema do professor.",
    "Pense como professor experiente que transforma um tema em mapa pedagógico coerente para apostilas, atividades, provas, revisões, sequências, projetos, roteiros e jogos.",
    "Inclua conteúdos que possam virar explicações, capítulos, exemplos, exercícios reais, propostas de investigação, jogos visuais, sínteses e gabaritos, conforme o tipo pretendido.",
    "Não gere códigos BNCC nesta resposta.",
    "Não use markdown.",
    "Não use bloco de código.",
    "Use conhecimento educacional amplo, padrões de REA/OER, BNCC, Bloom e acessibilidade como referência de estrutura; não copie textos, questões ou materiais protegidos.",
    "Retorne exclusivamente JSON válido.",
  ].join("\n");
}

export function buildMaterialContentSuggestionPrompt(input: MaterialContentSuggestionInput): string {
  return `
Monte um mapa pedagógico interno para o Gerador de Materiais Didáticos do Planify.

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
1. Monte de 5 a 8 blocos internos realmente compatíveis com o tema, componente, etapa e ano/série.
2. Use a web como inspiração de padrões pedagógicos e conhecimento geral, mas gere estrutura original, sem copiar conteúdo protegido.
3. Priorize fontes e padrões educacionais seguros: BNCC, REA/OER, domínio público, licença aberta, Bloom, acessibilidade e materiais próprios do professor/admin.
2. Esses blocos NÃO serão cards para o professor escolher e NÃO devem criar materiais separados; eles serão integrados automaticamente em um único material completo.
3. Não use termos genéricos como apenas "conceito", "exemplo", "leitura" ou "cultura" se eles não estiverem contextualizados.
4. Cada bloco deve ter título, descrição, palavras-chave, objetivos, dificuldade, tempo estimado e justificativa pedagógica.
5. As palavras-chave devem alimentar jogos visuais como cruzadinha, caça-palavras, bingo, memória, dominó, quiz e cartas.
6. Para Ensino Religioso e tema Jó, por exemplo, use blocos ligados à narrativa de Jó, fidelidade, paciência, sofrimento, esperança, provação, integridade, confiança e restauração.
7. Para Língua Espanhola, inclua vocabulário, comunicação, leitura, diálogos, cultura hispânica, países hispânicos e diversidade linguística quando fizer sentido.
8. Para jogos, recomende os modelos mais adequados ao tema e diga o motivo.
9. Para apostilas, pense em unidades explicativas: contextualização, conceitos, exemplos, vocabulário, box de curiosidade, imagens/infográficos sugeridos, exercícios de fixação, síntese e glossário.
9b. Para slides, sugira blocos em ordem de aula (contextualização → objetivos → conceitos em progressão → exemplo → checagem → síntese), permitindo que o professor selecione vários para compor uma apresentação sequencial.
10. Para atividades, provas, listas e revisões, pense em exercícios originais: complete, classifique, relacione, reescreva, interprete, justifique, resolva, produza, compare, analise e aplique.
11. Se o tema for Amazônia, respeite o componente: em Geografia trabalhe território, biodiversidade, povos, economia, impactos ambientais, conservação e cidadania; em Ciências trabalhe ecossistema, biodiversidade, água, clima e impactos; em História trabalhe povos, ocupação, conflitos, políticas e memória.
12. Se o componente for Redação, inclua tese, argumentos, repertório, coesão, parágrafo, conclusão, proposta de intervenção e reescrita.
13. Se o componente for Escrita Criativa, inclua personagem, cenário, conflito, narrador, diálogo, clímax, desfecho, descrição e reescrita criativa.
14. Não invente informações sensíveis, não crie doutrinação e mantenha abordagem pedagógica respeitosa.
15. A regra vale para todas as áreas: Línguas, Redação, Escrita Criativa, Matemática, Ciências, Humanas, Ensino Religioso, Arte e Educação Física. Retorne somente JSON válido.

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
      "tipo": "atividade | prova | lista | revisao | apostila | sequencia | jogo | projeto | roteiro",
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
