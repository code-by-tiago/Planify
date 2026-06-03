import type { MaterialAIInput, MaterialAISection } from "../../types/ai";
import { canonicalMaterialType, normalizeForPedagogy } from "./material-specialist-blueprints";

export function buildMaterialStructureContract(input: MaterialAIInput): string {
  const kind = canonicalMaterialType(input.tipo);
  const theme = input.tema || "tema estudado";

  const universal = [
    "A estrutura visual do material deve combinar com o tipo solicitado; não entregue tudo como texto corrido.",
    "Não use parágrafos longos para atividades, exercícios, listas, provas ou revisões. Use questões numeradas, tópicos, itens e comandos claros.",
    "Não coloque exercícios escondidos dentro de seções em forma de texto. Quando houver questão, ela deve estar no array questoes.",
    "A versão do aluno deve ser limpa, imprimível e pronta para uso. O gabarito deve ficar separado para o professor.",
    "Cada seção deve ter função real: ensinar, orientar, praticar, revisar, avaliar ou produzir. Nada de seção decorativa.",
  ];

  if (["atividade", "lista", "revisao"].includes(kind)) {
    return [
      ...universal,
      `Para ${kind}, use formato de folha de atividade: cabeçalho, comandos curtos, uma questão por item e espaço de resposta.`,
      "Cada questão deve ser direta e organizada em tópicos quando tiver mais de uma ação: • observe, • responda, • justifique, • registre.",
      "Evite texto explicativo antes das questões; explique apenas dentro do enunciado quando for indispensável para resolver.",
      "Varie o formato das questões: completar, relacionar, classificar, interpretar, justificar, comparar, produzir e desafio final.",
      "O gabarito deve repetir a numeração da versão do aluno e trazer resposta esperada objetiva.",
    ].join("\n");
  }

  if (kind === "prova") {
    return [
      ...universal,
      "Para prova, use formato avaliativo: cabeçalho, instruções breves, questões numeradas, alternativas quando houver e gabarito no final.",
      "Não ensine o conteúdo na prova; contextualize apenas o suficiente para avaliar.",
      "Combine questões objetivas e discursivas quando fizer sentido, com critérios de correção para as discursivas.",
      "Cada questão deve avaliar uma habilidade ou aspecto claro do conteúdo.",
    ].join("\n");
  }

  if (kind === "apostila") {
    return [
      ...universal,
      `Para apostila sobre ${theme}, use formato de pequeno livro didático.`,
      "Estruture em capa textual, apresentação curta, capítulos/unidades, explicações progressivas, exemplos, boxes, vocabulário, síntese e exercícios finais.",
      "A apostila deve ensinar antes de exercitar. Não comece com uma lista de perguntas.",
      "Os capítulos devem ter títulos claros, explicação consistente, tópicos internos e exemplos conectados ao componente curricular.",
      "Exercícios devem aparecer ao final de capítulos ou no fim da apostila, com gabarito separado.",
      "Não entregue apostila como parágrafo único, nem como plano de aula, nem como atividade simples.",
    ].join("\n");
  }

  if (kind === "sequencia") {
    return [
      ...universal,
      "Para sequência didática, use formato de aulas/momentos: Aula 1, Aula 2, Aula 3 ou Etapa 1, Etapa 2, Etapa 3.",
      "Cada aula deve ter objetivo, tempo, recursos, ação do professor, ação dos estudantes, evidência e avaliação.",
      "Não transforme sequência em lista de exercícios.",
    ].join("\n");
  }

  if (kind === "projeto") {
    return [
      ...universal,
      "Para projeto, use estrutura investigativa: problema norteador, justificativa curta, etapas, cronograma, produto final, socialização e rubrica.",
      "Não transforme projeto em atividade de perguntas. As tarefas devem ser etapas de produção, pesquisa, investigação ou intervenção.",
    ].join("\n");
  }

  if (kind === "roteiro") {
    return [
      ...universal,
      "Para roteiro de estudo, use passos de estudo autônomo: antes, durante, depois, checagem e autoavaliação.",
      "Use comandos curtos e progressivos para o aluno seguir sem depender de explicação longa.",
    ].join("\n");
  }

  if (kind === "jogo") {
    return [
      ...universal,
      "Para jogo, entregue peças, cartas, grade, cartelas, pistas, regras e gabarito conforme o modelo escolhido.",
      "Não entregue apenas explicação do jogo; o professor precisa do material jogável/imprimível.",
    ].join("\n");
  }

  return universal.join("\n");
}

export function shouldUseBulletStructure(kind: string): boolean {
  return ["atividade", "lista", "revisao", "prova"].includes(canonicalMaterialType(kind));
}

export function removeQuestionPreamble(value: unknown): string {
  return String(value || "")
    .replace(/^quest[aã]o\s*\d+\s*[:.)-]\s*/i, "")
    .replace(/^(leia com aten[cç][aã]o\s*[:.-]?\s*)/i, "")
    .replace(/^(responda\s*[aà]s?\s+quest[oõ]es?\s+abaixo\s*[:.-]?\s*)/i, "")
    .trim();
}

function splitSentences(value: string): string[] {
  return value
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function enforceQuestionBulletStructure(value: unknown): string {
  const cleaned = removeQuestionPreamble(value);
  if (!cleaned) return "Resolva o item com atenção.\n• Registre sua resposta no espaço indicado.\n• Justifique quando o comando solicitar.";
  if (/\n\s*[-•]/.test(cleaned) || /^\s*[-•]/m.test(cleaned)) return cleaned;

  const sentences = splitSentences(cleaned);
  if (sentences.length <= 1 && cleaned.length <= 180) return cleaned;

  const first = sentences.shift() || cleaned;
  const actions = sentences.length ? sentences : ["Registre sua resposta de forma organizada."];
  return [first, ...actions.slice(0, 4).map((sentence) => `• ${sentence.replace(/^[-•]\s*/, "")}`)].join("\n");
}

export function structureSectionsForMaterial(kindValue: unknown, sections: MaterialAISection[], theme: string): MaterialAISection[] {
  const kind = canonicalMaterialType(kindValue);
  const cleanTheme = String(theme || "tema estudado").trim() || "tema estudado";

  if (kind === "apostila") {
    return sections.map((section, index) => {
      const title = section.titulo || `Capítulo ${index + 1}`;
      const normalizedTitle = normalizeForPedagogy(title);
      const isBookPart = /capitulo|capítulo|unidade|apresentacao|apresentação|glossario|glossário|sintese|síntese|exercicios|exercícios|referencias|referências/.test(normalizedTitle);
      return {
        ...section,
        titulo: isBookPart ? title : `Capítulo ${index + 1} — ${title}`,
        itens: section.itens?.length ? section.itens : [
          `Ideia central do capítulo sobre ${cleanTheme}.`,
          "Exemplo contextualizado para o ano/série.",
          "Ponto de atenção para leitura e estudo.",
        ],
      };
    });
  }

  if (kind === "sequencia") {
    return sections.map((section, index) => {
      const title = section.titulo || `Aula ${index + 1}`;
      const normalizedTitle = normalizeForPedagogy(title);
      return {
        ...section,
        titulo: /aula|momento|etapa/.test(normalizedTitle) ? title : `Aula ${index + 1} — ${title}`,
        itens: section.itens?.length ? section.itens : ["Objetivo", "Tempo estimado", "Ação do professor", "Ação dos estudantes", "Evidência de aprendizagem"],
      };
    });
  }

  if (kind === "projeto") {
    return sections.map((section, index) => ({
      ...section,
      titulo: section.titulo || `Etapa ${index + 1}`,
      itens: section.itens?.length ? section.itens : ["Tarefa da etapa", "Registro esperado", "Critério de acompanhamento"],
    }));
  }

  return sections;
}
