import type { MaterialAIInput, MaterialAIOutput } from "../../types/ai";
import { buildVisualGameMaterial } from "./game-builder";
import { buildHardPedagogicalMaterial } from "./pedagogical-hard-engine";

function normalize(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function canonicalType(value: unknown): string {
  const type = normalize(value);
  if (type.includes("plano") && type.includes("aula")) return "plano-aula";
  if (type.includes("redacao")) return "redacao";
  if (type.includes("resumo")) return "resumo";
  if (type.includes("lista")) return "lista";
  if (type.includes("revis")) return "revisao";
  if (type.includes("sequencia")) return "sequencia";
  if (type.includes("roteiro")) return "roteiro";
  if (type.includes("projeto")) return "projeto";
  if (type.includes("apostila")) return "apostila";
  if (type.includes("prova") || type.includes("avaliacao")) return "prova";
  if (type.includes("jogo")) return "jogo";
  return "atividade";
}

const forbiddenPublicTerms = [
  "padrao de livro",
  "itens de a ate j",
  "motor do sistema",
  "motor pedagogico",
  "prompt",
  "json",
  "fallback",
  "bastidor",
  "nucleo pedagogico",
  "regra interna",
  "ia gerou",
  "inteligencia artificial gerou",
];

function hasForbiddenTerms(value: unknown): boolean {
  const text = normalize(value);
  return forbiddenPublicTerms.some((term) => text.includes(term));
}

function scrubText(value: unknown): string {
  return String(value ?? "")
    .replace(/material amplo em padrão de livro de atividades,?\s*/gi, "material organizado para uso em sala, ")
    .replace(/em padrão de livro de atividades/gi, "com organização didática")
    .replace(/com exemplos, itens internos de a até j,?/gi, "com exemplos variados,")
    .replace(/itens de a até j/gi, "vários itens")
    .replace(/motor pedagógico/gi, "organização pedagógica")
    .replace(/fallback/gi, "versão segura")
    .replace(/prompt/gi, "orientação")
    .replace(/JSON/gi, "estrutura")
    .replace(/IA gerou/gi, "foi preparado")
    .replace(/inteligência artificial gerou/gi, "foi preparado")
    .replace(/\s+/g, " ")
    .trim();
}

function scrubOutput(output: MaterialAIOutput): MaterialAIOutput {
  return {
    ...output,
    titulo: scrubText(output.titulo),
    subtitulo: scrubText(output.subtitulo),
    resumo: scrubText(output.resumo),
    introducao: scrubText(output.introducao),
    objetivos: output.objetivos.map(scrubText),
    conteudos: output.conteudos.map(scrubText),
    orientacoesProfessor: output.orientacoesProfessor.map(scrubText),
    orientacoesAluno: output.orientacoesAluno.map(scrubText),
    secoes: output.secoes.map((section) => ({
      ...section,
      titulo: scrubText(section.titulo),
      conteudo: scrubText(section.conteudo),
      itens: section.itens.map(scrubText),
    })),
    questoes: output.questoes.map((question) => ({
      ...question,
      tipo: scrubText(question.tipo),
      enunciado: scrubText(question.enunciado),
      alternativas: question.alternativas.map(scrubText),
      respostaEsperada: scrubText(question.respostaEsperada),
      criterioCorrecao: scrubText(question.criterioCorrecao),
    })),
    criteriosAvaliacao: output.criteriosAvaliacao.map(scrubText),
    gabarito: output.gabarito.map(scrubText),
    adaptacoesInclusivas: output.adaptacoesInclusivas.map(scrubText),
    sugestoesUso: output.sugestoesUso.map(scrubText),
    alertas: [],
  };
}

function publicText(output: MaterialAIOutput): string {
  return [
    output.titulo,
    output.subtitulo,
    output.resumo,
    output.introducao,
    ...output.objetivos,
    ...output.conteudos,
    ...output.orientacoesProfessor,
    ...output.orientacoesAluno,
    ...output.secoes.flatMap((section) => [section.titulo, section.conteudo, ...section.itens]),
    ...output.questoes.flatMap((question) => [
      question.tipo,
      question.enunciado,
      ...question.alternativas,
      question.respostaEsperada,
      question.criterioCorrecao,
    ]),
    ...output.criteriosAvaliacao,
    ...output.gabarito,
    ...output.adaptacoesInclusivas,
    ...output.sugestoesUso,
  ].join("\n");
}

function outputTextSize(output: MaterialAIOutput): number {
  return publicText(output).replace(/\s+/g, " ").trim().length;
}

function hasSection(output: MaterialAIOutput, pattern: RegExp): boolean {
  return output.secoes.some((section) => pattern.test(normalize(`${section.titulo} ${section.conteudo} ${section.itens.join(" ")}`)));
}

function hasQuestions(output: MaterialAIOutput, minimum: number): boolean {
  return Array.isArray(output.questoes) && output.questoes.length >= minimum;
}

function hasGameVisual(output: MaterialAIOutput): boolean {
  const game = output.jogo;
  if (!game) return false;
  const hasRules = Array.isArray(game.regras) && game.regras.length >= 2;
  const hasPlay = Array.isArray(game.modoDeJogar) && game.modoDeJogar.length >= 2;
  const hasPrintable = output.secoes.some((section) => Boolean(section.visualHtml) || /cartela|grade|carta|peca|peça|pista|pergunta/.test(normalize(section.titulo + " " + section.conteudo)));
  return hasRules && hasPlay && hasPrintable;
}

function hasProjectStructure(output: MaterialAIOutput): boolean {
  return Boolean(output.projeto)
    && hasSection(output, /apresentacao|apresenta/)
    && hasSection(output, /justificativa|problema norteador|questao norteadora/)
    && hasSection(output, /metodologia|etapa/)
    && hasSection(output, /produto final|socializacao|apresentacao/)
    && hasSection(output, /avaliacao|criterio/);
}

function hasRoteiroStructure(output: MaterialAIOutput): boolean {
  return Boolean(output.roteiro)
    && hasSection(output, /antes do estudo|antes/)
    && hasSection(output, /durante o estudo|durante/)
    && hasSection(output, /depois do estudo|autoavaliacao|autoavaliacao/);
}

function hasSequenciaStructure(output: MaterialAIOutput): boolean {
  return hasSection(output, /aula 1|primeira aula|mobilizacao|sondagem/)
    && hasSection(output, /aula 2|desenvolvimento|pratica|exercicios guiados/)
    && hasSection(output, /aula 3|fechamento|avaliacao|socializacao/);
}

function hasApostilaStructure(output: MaterialAIOutput): boolean {
  const sectionCount = Array.isArray(output.secoes) ? output.secoes.length : 0;
  const hasTeachingFlow = hasSection(output, /capitulo|unidade|explicacao|conceito|contextualizacao|apresentacao/)
    && hasSection(output, /exemplo|curiosidade|vocabulario|glossario|sintese|fixacao|pratica|exercicio/);

  return (sectionCount >= 5 && outputTextSize(output) >= 2200 && hasTeachingFlow)
    || (sectionCount >= 4 && hasTeachingFlow && (output.questoes.length >= 3 || hasSection(output, /fixacao|pratica|revisao|exercicio/)));
}

function hasAssessmentStructure(output: MaterialAIOutput): boolean {
  const hasObjective = output.questoes.some((question) => Array.isArray(question.alternativas) && question.alternativas.length >= 4);
  return hasQuestions(output, 8) && output.gabarito.length >= 6 && output.criteriosAvaliacao.length >= 3 && hasObjective;
}

function hasPracticeStructure(output: MaterialAIOutput): boolean {
  return hasQuestions(output, 8) && output.gabarito.length >= 6 && output.criteriosAvaliacao.length >= 3;
}

function hasRedacaoStructure(output: MaterialAIOutput): boolean {
  const motivadores = output.secoes.filter((section) =>
    /motivador/i.test(normalize(section.titulo)),
  ).length;
  return (
    motivadores >= 2 ||
    (output.secoes.length >= 3 &&
      hasSection(output, /tema|comando|proposta/) &&
      hasSection(output, /criterio|competencia|avaliacao/))
  );
}

function hasResumoStructure(output: MaterialAIOutput): boolean {
  return (
    output.secoes.length >= 3 &&
    hasSection(output, /ideia|conceito|panorama|resumo/) &&
    hasSection(output, /revisao|fixacao|checagem/)
  );
}

function hasPlanoAulaStructure(output: MaterialAIOutput): boolean {
  return (
    output.secoes.length >= 3 &&
    hasSection(output, /objetivo|bncc|identificacao/) &&
    hasSection(output, /desenvolvimento|etapa|aula/) &&
    (output.criteriosAvaliacao.length >= 2 ||
      hasSection(output, /avaliacao|recurso/))
  );
}

function isWrongType(output: MaterialAIOutput, type: string): boolean {
  if (type !== "jogo" && output.jogo) return true;
  if (type !== "projeto" && output.projeto) return true;
  if (type !== "roteiro" && output.roteiro) return true;

  if (["projeto", "sequencia", "roteiro", "plano-aula", "redacao", "resumo"].includes(type) && output.questoes.length > 0) return true;

  if (type === "jogo") return !hasGameVisual(output);
  if (type === "projeto") return !hasProjectStructure(output);
  if (type === "roteiro") return !hasRoteiroStructure(output);
  if (type === "sequencia") return !hasSequenciaStructure(output);
  if (type === "apostila") return !hasApostilaStructure(output);
  if (type === "prova") return !hasAssessmentStructure(output);
  if (["atividade", "lista", "revisao"].includes(type)) return !hasPracticeStructure(output);
  if (type === "redacao") return !hasRedacaoStructure(output);
  if (type === "resumo") return !hasResumoStructure(output);
  if (type === "plano-aula") return !hasPlanoAulaStructure(output);

  return false;
}

function rebuildByType(input: MaterialAIInput, type: string, output?: Partial<MaterialAIOutput>): MaterialAIOutput {
  if (type === "jogo") {
    return scrubOutput(buildVisualGameMaterial(input, output));
  }

  return scrubOutput(buildHardPedagogicalMaterial({ ...input, tipo: type }));
}

export function enforceMaterialTypeContract(input: MaterialAIInput, output: MaterialAIOutput): MaterialAIOutput {
  const type = canonicalType(input.tipo);
  const normalized: MaterialAIOutput = scrubOutput({
    ...output,
    tipo: type,
    jogo: type === "jogo" ? output.jogo : undefined,
    projeto: type === "projeto" ? output.projeto : undefined,
    roteiro: type === "roteiro" ? output.roteiro : undefined,
    questoes: ["projeto", "sequencia", "roteiro", "plano-aula", "redacao", "resumo"].includes(type)
      ? []
      : output.questoes,
    alertas: [],
  });

  if (hasForbiddenTerms(publicText(normalized)) || isWrongType(normalized, type)) {
    const rebuilt = rebuildByType(input, type, output);
    return scrubOutput({
      ...rebuilt,
      alertas: [
        ...(rebuilt.alertas ?? []),
        "A validação detectou formato inadequado. Regenerar o material costuma entregar conteúdo mais específico e completo.",
      ],
    });
  }

  return normalized;
}
