import type { MaterialAIInput, MaterialAIOutput, MaterialAIQuestion, MaterialAISection } from "../../types/ai";

type DirectKind = "atividade" | "prova" | "lista" | "revisao" | "apostila";

function normalize(value: unknown) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

function normalizeConteudos(conteudos: MaterialAIInput["conteudos"]): string[] {
  if (Array.isArray(conteudos)) return conteudos.map((item) => String(item).trim()).filter(Boolean);
  return String(conteudos || "")
    .split(/\r?\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function expectedQuantity(input: MaterialAIInput): number | null {
  const value = Number(String(input.quantidadeQuestoes || "").replace(/[^0-9]/g, ""));
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.min(60, Math.max(1, value));
}

function isQuestionProduct(type: string): type is DirectKind {
  return ["atividade", "prova", "lista", "revisao", "apostila"].includes(normalize(type));
}

function uniq(values: string[]): string[] {
  return Array.from(new Set(values.map((item) => String(item || "").trim()).filter(Boolean)));
}

function cleanText(value: unknown) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .trim();
}

function removeLeadingQuestionLabel(value: string) {
  return value
    .replace(/^quest[aã]o\s*\d+\s*[:).–-]*\s*/i, "")
    .replace(/^exerc[ií]cio\s*\d+\s*[:).–-]*\s*/i, "")
    .trim();
}

function buildQuestionCommand(input: MaterialAIInput, index: number): { tipo: string; enunciado: string; resposta: string; criterio: string } {
  const tema = cleanText(input.tema) || "tema estudado";
  const component = cleanText(input.componenteCurricular) || "componente curricular";
  const conteudos = normalizeConteudos(input.conteudos);
  const conteudo = conteudos[index % Math.max(1, conteudos.length)] || tema;
  const family = normalize(component);
  const patterns = [
    {
      tipo: "identificação",
      enunciado: `Identifique dois conceitos centrais relacionados a ${conteudo}. Em seguida, explique com suas palavras como eles se conectam ao tema ${tema}.`,
      resposta: `O aluno deve identificar conceitos pertinentes a ${conteudo} e explicar a relação deles com ${tema}.`,
      criterio: "Avaliar pertinência dos conceitos, clareza da explicação e relação com o conteúdo estudado.",
    },
    {
      tipo: "classificação",
      enunciado: `Classifique as situações abaixo de acordo com o conteúdo ${conteudo}:\n• Situação 1 relacionada ao tema ${tema}\n• Situação 2 relacionada ao contexto trabalhado\n• Situação 3 relacionada à aplicação do conhecimento`,
      resposta: `O aluno deve classificar cada situação usando critérios coerentes com ${conteudo}.`,
      criterio: "Considerar uso correto dos critérios, justificativa e coerência com o conteúdo.",
    },
    {
      tipo: "análise",
      enunciado: `Analise a afirmação: "${tema} exige observar conceitos, contexto e consequências". Explique se a afirmação está adequada ao estudo de ${component}.`,
      resposta: `Espera-se análise coerente que relacione a afirmação ao componente ${component} e ao conteúdo ${conteudo}.`,
      criterio: "Avaliar argumentação, uso de conceitos e relação com o componente curricular.",
    },
    {
      tipo: "aplicação",
      enunciado: `Resolva ou desenvolva uma resposta aplicada: como o conteúdo ${conteudo} pode ser usado para compreender uma situação real ligada a ${tema}?`,
      resposta: `O aluno deve aplicar ${conteudo} a uma situação real, com exemplo e explicação adequada ao ano/série.`,
      criterio: "Considerar aplicação correta, exemplo pertinente e organização da resposta.",
    },
    {
      tipo: "síntese",
      enunciado: `Produza uma síntese em 4 a 6 linhas explicando o que foi aprendido sobre ${tema}, usando pelo menos dois termos importantes do conteúdo ${conteudo}.`,
      resposta: `Síntese com ideias centrais sobre ${tema} e uso adequado de pelo menos dois termos do conteúdo.`,
      criterio: "Avaliar compreensão, uso de vocabulário, coerência e clareza.",
    },
  ];

  if (family.includes("matematica")) {
    patterns[1] = {
      tipo: "resolução",
      enunciado: `Resolva uma situação-problema envolvendo ${conteudo}. Apresente o raciocínio, os cálculos ou representações usados e conclua a resposta.`,
      resposta: `O aluno deve resolver o problema com procedimento matemático adequado e conclusão coerente.`,
      criterio: "Avaliar interpretação, procedimento, cálculo/representação e resposta final.",
    };
  }

  if (family.includes("portuguesa") || family.includes("redacao") || family.includes("escrita")) {
    patterns[1] = {
      tipo: "análise linguística",
      enunciado: `Leia os itens e responda ao comando indicado:\n• Exemplo 1 relacionado a ${tema}\n• Exemplo 2 relacionado ao conteúdo ${conteudo}\n• Exemplo 3 para comparação e justificativa`,
      resposta: `O aluno deve analisar os exemplos, aplicar o conteúdo e justificar a resposta com clareza.`,
      criterio: "Avaliar identificação correta, justificativa, uso de linguagem adequada e organização.",
    };
  }

  return patterns[index % patterns.length];
}

function normalizeQuestion(input: MaterialAIInput, question: Partial<MaterialAIQuestion>, index: number): MaterialAIQuestion {
  const generated = buildQuestionCommand(input, index);
  const rawEnunciado = cleanText(question.enunciado || generated.enunciado);
  const enunciado = removeLeadingQuestionLabel(rawEnunciado)
    .replace(/\s+([a-jA-J]\))/g, "\n$1")
    .replace(/\s+•\s+/g, "\n• ")
    .trim();

  const alternativas = Array.isArray(question.alternativas)
    ? question.alternativas.map((item) => cleanText(item).replace(/^[A-Ea-e][).:-]\s*/, "")).filter(Boolean)
    : [];

  return {
    numero: index + 1,
    tipo: cleanText(question.tipo || generated.tipo),
    enunciado: enunciado || generated.enunciado,
    alternativas,
    respostaEsperada: cleanText(question.respostaEsperada || generated.resposta),
    criterioCorrecao: cleanText(question.criterioCorrecao || generated.criterio),
  };
}

function ensureQuestionQuantity(input: MaterialAIInput, output: MaterialAIOutput): MaterialAIQuestion[] {
  const quantity = expectedQuantity(input);
  const current = Array.isArray(output.questoes) ? output.questoes : [];
  const wanted = isQuestionProduct(String(input.tipo || output.tipo)) && quantity ? quantity : current.length;

  if (!wanted) return current.map((question, index) => normalizeQuestion(input, question, index));

  const fixed: MaterialAIQuestion[] = [];
  for (let index = 0; index < wanted; index += 1) {
    fixed.push(normalizeQuestion(input, current[index] || {}, index));
  }
  return fixed;
}

function buildGabarito(questions: MaterialAIQuestion[]): string[] {
  return questions.map((question) => {
    const resposta = question.respostaEsperada || "Resposta esperada compatível com o conteúdo estudado.";
    const criterio = question.criterioCorrecao || "Avaliar coerência, clareza, uso do conteúdo e organização da resposta.";
    return `Questão ${question.numero}: ${resposta} Critério de correção: ${criterio}`;
  });
}

function ensureSections(input: MaterialAIInput, output: MaterialAIOutput): MaterialAISection[] {
  const type = normalize(input.tipo || output.tipo);
  const sections = Array.isArray(output.secoes) ? output.secoes : [];
  const conteudos = normalizeConteudos(input.conteudos);
  const tema = cleanText(input.tema) || "tema estudado";

  if (type !== "apostila" && sections.length) return sections;
  if (type !== "apostila") return sections;

  const baseSections: MaterialAISection[] = [
    {
      titulo: `Unidade 1 — Contextualização de ${tema}`,
      conteudo: `Apresentação do tema ${tema} com linguagem adequada à turma, retomando conhecimentos prévios e situando o conteúdo no componente ${input.componenteCurricular}.`,
      itens: ["Leitura inicial", "Vocabulário essencial", "Exemplo contextualizado"],
    },
    {
      titulo: `Unidade 2 — Conceitos e relações principais`,
      conteudo: `Estudo dos conceitos centrais, suas relações, exemplos e cuidados de interpretação para evitar aprendizagem superficial ou memorização mecânica.`,
      itens: uniq(conteudos.slice(0, 5).length ? conteudos.slice(0, 5) : [tema, "conceitos centrais", "exemplos", "aplicações"]),
    },
    {
      titulo: `Unidade 3 — Exemplos, análise e aplicação`,
      conteudo: `Aplicação do conteúdo em situações reais, perguntas orientadoras, comparação de exemplos e prática guiada antes dos exercícios finais.`,
      itens: ["Exemplos resolvidos", "Análise orientada", "Aplicação em contexto", "Síntese parcial"],
    },
    {
      titulo: "Síntese, glossário e estudo dirigido",
      conteudo: `Fechamento da apostila com síntese das ideias principais, glossário de termos relevantes e orientação para revisão antes dos exercícios.`,
      itens: ["Síntese final", "Glossário", "Autoavaliação", "Exercícios de fixação"],
    },
  ];

  const merged = sections.length >= 3 ? sections : baseSections;
  return merged.map((section, index) => ({
    titulo: cleanText(section.titulo || baseSections[index % baseSections.length].titulo),
    conteudo: cleanText(section.conteudo || baseSections[index % baseSections.length].conteudo),
    itens: uniq(Array.isArray(section.itens) && section.itens.length ? section.itens : baseSections[index % baseSections.length].itens),
    visualHtml: section.visualHtml,
  }));
}

function ensureEvaluationCriteria(input: MaterialAIInput, output: MaterialAIOutput): string[] {
  const type = normalize(input.tipo || output.tipo);
  const base = Array.isArray(output.criteriosAvaliacao) ? output.criteriosAvaliacao : [];
  const custom = String(input.criteriosAvaliacaoPersonalizados || "").trim();
  const defaults = [
    "Compreensão dos conceitos essenciais do tema.",
    "Coerência entre resposta, comando e conteúdo estudado.",
    "Uso de exemplos, justificativas ou procedimentos quando solicitados.",
    "Organização, clareza e linguagem adequada ao ano/série.",
  ];

  if (type === "projeto") defaults.push("Qualidade do produto final, participação no processo e socialização dos resultados.");
  if (type === "prova") defaults.push("Pontuação pode ser ajustada pelo professor conforme peso de cada questão.");
  if (custom) defaults.unshift(custom);

  return uniq([...base, ...defaults]).slice(0, 8);
}

function ensureStudentTeacherSeparation(output: MaterialAIOutput): MaterialAIOutput {
  return {
    ...output,
    orientacoesProfessor: uniq(output.orientacoesProfessor || []).slice(0, 6),
    orientacoesAluno: uniq(output.orientacoesAluno || []).slice(0, 5),
    sugestoesUso: uniq(output.sugestoesUso || []).slice(0, 5),
    adaptacoesInclusivas: uniq(output.adaptacoesInclusivas || []).slice(0, 5),
  };
}

export function auditMaterialAgainstKnowledgeEngine(input: MaterialAIInput, output: MaterialAIOutput): MaterialAIOutput {
  const questoes = ensureQuestionQuantity(input, output);
  const type = normalize(input.tipo || output.tipo);
  const gabarito = isQuestionProduct(type) || questoes.length ? buildGabarito(questoes) : output.gabarito || [];

  const audited: MaterialAIOutput = {
    ...output,
    tipo: output.tipo || String(input.tipo || "material"),
    titulo: output.titulo || input.titulo || `${input.tipo} — ${input.tema}`,
    subtitulo: output.subtitulo || `${input.componenteCurricular} • ${input.anoSerie}`,
    resumo: output.resumo || `Material original gerado para ${input.componenteCurricular}, ${input.anoSerie}, sobre ${input.tema}.`,
    conteudos: uniq([...(output.conteudos || []), ...normalizeConteudos(input.conteudos)]),
    secoes: ensureSections(input, output),
    questoes,
    gabarito,
    criteriosAvaliacao: ensureEvaluationCriteria(input, output),
    alertas: [],
  };

  return ensureStudentTeacherSeparation(audited);
}
