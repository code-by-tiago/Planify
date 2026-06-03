import type {
  MaterialAIInput,
  MaterialAIOutput,
  MaterialAIQuestion,
  MaterialAISection,
} from "../../types/ai";
import { buildHardPedagogicalMaterial } from "./pedagogical-hard-engine";
import {
  buildCompletionQuestion,
  buildContentCoverageSection,
  buildRequiredSections,
  canonicalMaterialType,
  getMaterialBlueprint,
  normalizeForPedagogy,
  normalizeInputContents,
  normalizeStringList,
} from "./material-specialist-blueprints";

type QualityIssue = {
  code: string;
  message: string;
};

const NUMBER_WORDS: Record<string, number> = {
  uma: 1,
  um: 1,
  duas: 2,
  dois: 2,
  tres: 3,
  três: 3,
  quatro: 4,
  cinco: 5,
  seis: 6,
  sete: 7,
  oito: 8,
  nove: 9,
  dez: 10,
  onze: 11,
  doze: 12,
  treze: 13,
  quatorze: 14,
  catorze: 14,
  quinze: 15,
  dezesseis: 16,
  dezassete: 17,
  dezessete: 17,
  dezoito: 18,
  dezenove: 19,
  vinte: 20,
  vinteuma: 21,
  vinteum: 21,
  vinteduas: 22,
  vintedois: 22,
  vintetres: 23,
  vintetrês: 23,
  vintequatro: 24,
  vintecinc: 25,
  vintecinco: 25,
  trinta: 30,
  quarenta: 40,
};

function cleanNumberText(value: string): string {
  return normalizeForPedagogy(value).replace(/\s+/g, "");
}

function clampExactCount(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 10;
  return Math.max(1, Math.min(Math.trunc(value), 40));
}

function textSources(input: MaterialAIInput): string[] {
  return [
    input.quantidadeQuestoes,
    input.titulo,
    input.tema,
    input.finalidade,
    input.orientacoes,
    input.observacoes,
    input.criteriosAvaliacaoPersonalizados,
  ].map((item) => String(item ?? ""));
}

export function requestedQuestionCount(input: MaterialAIInput): number | null {
  const blueprint = getMaterialBlueprint(input);
  const kind = canonicalMaterialType(input.tipo);
  if (!blueprint.allowsQuestions || ["projeto", "sequencia", "roteiro", "jogo"].includes(kind)) return null;

  const direct = String(input.quantidadeQuestoes || "").match(/\d{1,2}/);
  if (direct) return clampExactCount(Number(direct[0]));

  const joined = textSources(input).map(normalizeForPedagogy).join(" ");
  const numeric = joined.match(/(?:com|ter|gerar|criar|preparar|elaborar|incluir|montar|fazer|entregar|produzir)?\s*(\d{1,2})\s*(?:questoes|perguntas|exercicios|itens|atividades|problemas)/i);
  if (numeric) return clampExactCount(Number(numeric[1]));

  const compact = cleanNumberText(joined);
  for (const [word, number] of Object.entries(NUMBER_WORDS)) {
    if (compact.includes(`${word}questoes`) || compact.includes(`${word}perguntas`) || compact.includes(`${word}exercicios`) || compact.includes(`${word}itens`)) {
      return clampExactCount(number);
    }
  }

  return blueprint.defaultQuestionCount;
}

function sectionSignature(section: Partial<MaterialAISection>): string {
  return normalizeForPedagogy(`${section.titulo || ""} ${section.conteudo || ""}`).slice(0, 220);
}

function questionSignature(question: Partial<MaterialAIQuestion>): string {
  return normalizeForPedagogy(`${question.tipo || ""} ${question.enunciado || ""}`).slice(0, 220);
}

function cleanQuestion(question: Partial<MaterialAIQuestion>, index: number): MaterialAIQuestion {
  const tipo = String(question.tipo || "discursiva contextualizada").trim() || "discursiva contextualizada";
  const enunciado = String(question.enunciado || "").trim();
  const respostaEsperada = String(question.respostaEsperada || "Resposta esperada conforme o conteúdo estudado.").trim();
  const criterioCorrecao = String(question.criterioCorrecao || "Avaliar coerência, domínio do conteúdo, justificativa e clareza.").trim();

  return {
    numero: index + 1,
    tipo,
    enunciado: enunciado || `Questão ${index + 1}: responda com base no conteúdo estudado.`,
    alternativas: normalizeStringList(question.alternativas),
    respostaEsperada,
    criterioCorrecao,
  };
}

function uniqueQuestions(primary: Partial<MaterialAIQuestion>[], fallback: Partial<MaterialAIQuestion>[]): MaterialAIQuestion[] {
  const signatures = new Set<string>();
  const questions: MaterialAIQuestion[] = [];

  [...primary, ...fallback].forEach((question) => {
    const signature = questionSignature(question);
    if (!signature || signatures.has(signature)) return;
    signatures.add(signature);
    questions.push(cleanQuestion(question, questions.length));
  });

  return questions;
}

function ensureExactQuestions(input: MaterialAIInput, output: MaterialAIOutput, fallback: MaterialAIOutput, issues: QualityIssue[]): MaterialAIQuestion[] {
  const expected = requestedQuestionCount(input);
  if (expected === null) return [];

  const merged = uniqueQuestions(output.questoes || [], fallback.questoes || []);
  while (merged.length < expected) {
    merged.push(buildCompletionQuestion(input, merged.length));
  }

  const exact = merged.slice(0, expected).map((question, index) => cleanQuestion(question, index));

  if ((output.questoes || []).length !== expected) {
    issues.push({
      code: "exact_question_count_enforced",
      message: `Quantidade de questões ajustada para ${expected}.`,
    });
  }

  return exact;
}

function buildGabarito(questions: MaterialAIQuestion[]): string[] {
  return questions.map((question) => {
    const alternatives = question.alternativas.length ? ` Alternativas: ${question.alternativas.join(" ")}` : "";
    return `Questão ${question.numero}: ${question.respostaEsperada}${alternatives} Critério: ${question.criterioCorrecao}`;
  });
}

function cleanSection(section: Partial<MaterialAISection>, fallbackTitle = "Seção didática"): MaterialAISection {
  return {
    titulo: String(section.titulo || fallbackTitle).trim() || fallbackTitle,
    conteudo: String(section.conteudo || "").trim(),
    itens: normalizeStringList(section.itens),
    visualHtml: section.visualHtml,
  };
}

function mergeUniqueSections(sections: Partial<MaterialAISection>[]): MaterialAISection[] {
  const signatures = new Set<string>();
  const merged: MaterialAISection[] = [];

  sections.forEach((section) => {
    const cleaned = cleanSection(section);
    const signature = sectionSignature(cleaned);
    if (!signature || signatures.has(signature)) return;
    signatures.add(signature);
    merged.push(cleaned);
  });

  return merged;
}

function hasSectionForKeywords(sections: MaterialAISection[], keywords: string[]): boolean {
  const normalizedKeywords = keywords.map(normalizeForPedagogy).filter(Boolean);
  return sections.some((sectionItem) => {
    const haystack = normalizeForPedagogy(`${sectionItem.titulo} ${sectionItem.conteudo} ${sectionItem.itens.join(" ")}`);
    return normalizedKeywords.some((keyword) => haystack.includes(keyword));
  });
}

function ensureBlueprintSections(input: MaterialAIInput, output: MaterialAIOutput, fallback: MaterialAIOutput, issues: QualityIssue[]): MaterialAISection[] {
  const blueprint = getMaterialBlueprint(input);
  const current = mergeUniqueSections([...(output.secoes || []), ...(fallback.secoes || [])]);
  const required = buildRequiredSections(input);
  const completed = [...current];

  required.forEach((sectionItem) => {
    const keywords = [sectionItem.titulo, ...(sectionItem.itens || [])]
      .flatMap((item) => normalizeForPedagogy(item).split(" "))
      .filter((item) => item.length > 4);
    const importantKeywords = [sectionItem.titulo, ...keywords].slice(0, 8);
    if (!hasSectionForKeywords(completed, importantKeywords)) {
      completed.push(sectionItem);
      issues.push({ code: "required_section_added", message: `Seção obrigatória adicionada: ${sectionItem.titulo}.` });
    }
  });

  while (completed.length < blueprint.minSections) {
    const missingIndex = completed.length + 1;
    completed.push({
      titulo: `Aprofundamento didático ${missingIndex}`,
      conteudo: `Bloco complementar para ampliar a qualidade do material sobre ${input.tema}, mantendo coerência com ${input.componenteCurricular} e com o tipo ${blueprint.kind}.`,
      itens: [
        "Conceito central trabalhado.",
        "Exemplo contextualizado para a turma.",
        "Comando de registro ou reflexão.",
        "Evidência esperada de aprendizagem.",
      ],
    });
    issues.push({ code: "minimum_section_depth_enforced", message: "Profundidade mínima de seções reforçada." });
  }

  return mergeUniqueSections(completed);
}

function ensureContentCoverage(input: MaterialAIInput, sections: MaterialAISection[], questions: MaterialAIQuestion[], issues: QualityIssue[]): MaterialAISection[] {
  const contents = normalizeInputContents(input.conteudos);
  if (!contents.length) return sections;

  const fullText = normalizeForPedagogy([
    ...sections.map((sectionItem) => `${sectionItem.titulo} ${sectionItem.conteudo} ${sectionItem.itens.join(" ")}`),
    ...questions.map((question) => `${question.enunciado} ${question.respostaEsperada} ${question.criterioCorrecao}`),
  ].join(" "));

  const completed = [...sections];
  contents.forEach((content) => {
    const normalizedContent = normalizeForPedagogy(content);
    const importantWords = normalizedContent.split(" ").filter((word) => word.length >= 5);
    const covered = normalizedContent && (fullText.includes(normalizedContent) || importantWords.some((word) => fullText.includes(word)));
    if (!covered) {
      completed.push(buildContentCoverageSection(input, content));
      issues.push({ code: "content_coverage_added", message: `Conteúdo reforçado: ${content}.` });
    }
  });

  return completed;
}

function ensureCommonQualityArrays(input: MaterialAIInput, output: MaterialAIOutput): Pick<MaterialAIOutput, "objetivos" | "orientacoesProfessor" | "orientacoesAluno" | "criteriosAvaliacao" | "adaptacoesInclusivas" | "sugestoesUso"> {
  const blueprint = getMaterialBlueprint(input);
  const theme = String(input.tema || "tema estudado").trim() || "tema estudado";
  const component = String(input.componenteCurricular || "componente curricular").trim() || "componente curricular";

  return {
    objetivos: normalizeStringList(output.objetivos).length ? normalizeStringList(output.objetivos) : [
      `Compreender conceitos essenciais de ${theme} em ${component}.`,
      "Aplicar o conhecimento em situações contextualizadas ao ano/série.",
      "Registrar respostas, produções ou conclusões com clareza e justificativa.",
    ],
    orientacoesProfessor: normalizeStringList(output.orientacoesProfessor).length ? normalizeStringList(output.orientacoesProfessor) : [
      `Aplicar o material como ${blueprint.kind}, sem mudar a finalidade para outro formato.`,
      "Ler as orientações antes de entregar a versão do aluno.",
      "Usar o gabarito e os critérios para correção, retomada e devolutiva.",
    ],
    orientacoesAluno: normalizeStringList(output.orientacoesAluno).length ? normalizeStringList(output.orientacoesAluno) : [
      "Leia os comandos com atenção antes de responder.",
      "Registre seu raciocínio, exemplos e justificativas quando solicitado.",
      "Revise suas respostas antes da entrega.",
    ],
    criteriosAvaliacao: normalizeStringList(output.criteriosAvaliacao).length ? normalizeStringList(output.criteriosAvaliacao) : [
      "Domínio dos conceitos trabalhados.",
      "Clareza, organização e adequação ao comando.",
      "Uso de exemplos, justificativas ou procedimentos coerentes com o componente curricular.",
      "Participação, autonomia e qualidade dos registros, quando aplicável.",
    ],
    adaptacoesInclusivas: normalizeStringList(output.adaptacoesInclusivas).length ? normalizeStringList(output.adaptacoesInclusivas) : [
      "Permitir leitura compartilhada dos comandos quando necessário.",
      "Oferecer tempo adicional ou mediação para estudantes com maior dificuldade.",
      "Aceitar respostas orais, esquemas, desenhos, mapas ou registros alternativos quando compatíveis com o objetivo.",
    ],
    sugestoesUso: normalizeStringList(output.sugestoesUso).length ? normalizeStringList(output.sugestoesUso) : [
      "Usar o material após breve contextualização do tema.",
      "Realizar correção dialogada para transformar erros em retomada de aprendizagem.",
      "Guardar as respostas como evidência para planejamento da próxima aula.",
    ],
  };
}

function removeWrongBlocks(input: MaterialAIInput, output: MaterialAIOutput): MaterialAIOutput {
  const kind = canonicalMaterialType(input.tipo);
  return {
    ...output,
    tipo: kind,
    jogo: kind === "jogo" ? output.jogo : undefined,
    projeto: kind === "projeto" ? output.projeto : undefined,
    roteiro: kind === "roteiro" ? output.roteiro : undefined,
    questoes: ["projeto", "sequencia", "roteiro", "jogo"].includes(kind) ? [] : output.questoes,
    gabarito: ["projeto", "sequencia", "roteiro", "jogo"].includes(kind) ? [] : output.gabarito,
    alertas: [],
  };
}

function ensureSpecialBlocks(input: MaterialAIInput, output: MaterialAIOutput): Partial<MaterialAIOutput> {
  const kind = canonicalMaterialType(input.tipo);
  const theme = String(input.tema || "tema estudado").trim() || "tema estudado";

  if (kind === "projeto") {
    const projeto = output.projeto || {
      problemaNorteador: `Como investigar e produzir uma resposta escolar relevante sobre ${theme}?`,
      etapas: [
        "Levantamento de conhecimentos prévios e definição do problema.",
        "Pesquisa, observação, leitura ou coleta de dados.",
        "Organização das informações e planejamento do produto final.",
        "Produção, revisão e socialização dos resultados.",
      ],
      produtoFinal: `Produto autoral sobre ${theme}, definido pelo professor conforme recursos da escola.`,
      avaliacao: "Rubrica com critérios de conteúdo, processo, colaboração, comunicação e qualidade do produto final.",
    };
    return { projeto };
  }

  if (kind === "roteiro") {
    const roteiro = output.roteiro || {
      antesDoEstudo: ["Separe o material", "Leia o objetivo", "Registre o que você já sabe"],
      duranteOEstudo: ["Leia com atenção", "Anote palavras-chave", "Marque dúvidas", "Resolva as tarefas propostas"],
      depoisDoEstudo: ["Faça uma síntese", "Confira seus registros", "Indique o que precisa revisar"],
      autoavaliacao: ["Compreendi o tema", "Consigo explicar com minhas palavras", "Preciso de ajuda em", "Meu próximo passo será"],
    };
    return { roteiro };
  }

  return {};
}

export function guardMaterialQuality(input: MaterialAIInput, output: MaterialAIOutput): MaterialAIOutput {
  const fallback = buildHardPedagogicalMaterial(input);
  const issues: QualityIssue[] = [];
  const blueprint = getMaterialBlueprint(input);
  const withoutWrongBlocks = removeWrongBlocks(input, output);
  const questions = ensureExactQuestions(input, withoutWrongBlocks, fallback, issues);
  const sectionsFromBlueprint = ensureBlueprintSections(input, withoutWrongBlocks, fallback, issues);
  const sections = ensureContentCoverage(input, sectionsFromBlueprint, questions, issues);
  const qualityArrays = ensureCommonQualityArrays(input, withoutWrongBlocks);
  const specialBlocks = ensureSpecialBlocks(input, withoutWrongBlocks);

  const title = String(withoutWrongBlocks.titulo || input.titulo || `${input.tipo} — ${input.tema}`).trim();
  const subtitle = String(withoutWrongBlocks.subtitulo || `${blueprint.specialistName.replace("Especialista Planify em ", "")} para ${input.anoSerie}`).trim();

  return {
    ...withoutWrongBlocks,
    ...qualityArrays,
    ...specialBlocks,
    titulo: title,
    subtitulo: subtitle,
    tipo: blueprint.kind,
    resumo: String(withoutWrongBlocks.resumo || blueprint.qualityMission).trim(),
    introducao: String(withoutWrongBlocks.introducao || `Este material foi organizado para trabalhar ${input.tema} em ${input.componenteCurricular}, respeitando o ano/série, a finalidade e o tipo solicitado pelo professor.`).trim(),
    conteudos: normalizeStringList(withoutWrongBlocks.conteudos).length ? normalizeStringList(withoutWrongBlocks.conteudos) : normalizeInputContents(input.conteudos),
    secoes: sections,
    questoes: questions,
    gabarito: questions.length ? buildGabarito(questions) : normalizeStringList(withoutWrongBlocks.gabarito),
    alertas: [],
  };
}
