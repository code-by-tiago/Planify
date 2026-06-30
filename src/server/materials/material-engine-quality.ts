import {
  collectQuestionSemanticIssues,
  collectSectionSemanticIssues,
  isGenericEducationalText,
} from "@/lib/materiais/material-semantic-quality";
import { TEACHY_QUALITY_RULES } from "@/lib/materiais/teachy-document-contract";
import type {
  MaterialEngineRequest,
  MaterialEngineResponse,
} from "./material-engine-types";
import { validateProvaEngineOutput } from "./prova-engine-contract";

const COUNT_TOLERANCE = 1;
const MAX_STATEMENT_CHARS = 320;
const MIN_MC_OPTIONS = 4;

function countStatementSentences(text: string): number {
  return text
    .split(/[.!?]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 2).length;
}

/** Issues de uma única questão/exercício (prova/lista) — usado no reparo automático. */
export function collectSingleExamQuestionIssues(
  request: Pick<MaterialEngineRequest, "tema" | "tipoMaterial">,
  question: {
    number?: number;
    type?: string;
    statement?: string;
    answer?: string;
    options?: string[];
  },
): string[] {
  const issues: string[] = [];
  const statement = question.statement?.trim() || "";

  if (statement.length > MAX_STATEMENT_CHARS) {
    issues.push("enunciado longo demais — máximo 3 frases curtas e diretas.");
  } else if (countStatementSentences(statement) > 3) {
    issues.push("limite de 3 frases no enunciado — seja mais direto.");
  }

  if (
    question.type === "multipla-escolha" &&
    (question.options?.length ?? 0) < MIN_MC_OPTIONS
  ) {
    issues.push(
      `múltipla escolha exige pelo menos ${MIN_MC_OPTIONS} alternativas distintas.`,
    );
  }

  for (const semantic of collectQuestionSemanticIssues({
    statement: question.statement || "",
    answer: question.answer,
    options: question.options,
    tema: request.tema,
    questionType: question.type,
  }).slice(0, 3)) {
    issues.push(semantic);
  }

  return issues;
}

function countIssues(
  label: string,
  expected: number,
  actual: number,
): string | null {
  if (actual === 0) {
    return `${label}: nenhum item foi gerado (esperado ${expected}).`;
  }
  if (actual < expected - COUNT_TOLERANCE || actual > expected + COUNT_TOLERANCE) {
    return `${label}: esperado ${expected}, recebido ${actual}.`;
  }
  return null;
}

function normalizeCruzadinhaTerm(value: string): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();
}

function parseCruzadinhaComponent(line: string): {
  raw: string;
  term: string;
  normalizedTerm: string;
  clue: string;
} {
  const raw = String(line || "")
    .replace(/^[\s•*-]+/, "")
    .replace(/\s+/g, " ")
    .trim();
  const match = raw.match(/^(?:\d+[.)]\s*)?([^:：–—-]{2,40})\s*[:：–—-]\s*(.+)$/);
  const term = (match?.[1] || raw).trim();
  const clue = (match?.[2] || "").trim();

  return {
    raw,
    term,
    normalizedTerm: normalizeCruzadinhaTerm(term),
    clue,
  };
}

export function getEngineOutputIssues(
  request: MaterialEngineRequest,
  output: MaterialEngineResponse,
): string[] {
  if (request.tipoMaterial === "prova") {
    return validateProvaEngineOutput(request, output);
  }

  const issues: string[] = [];
  const q = request.quantidade;
  const tipo = request.tipoMaterial;

  if (tipo === "slides") {
    const issue = countIssues("slides", q, output.slides?.length ?? 0);
    if (issue) issues.push(issue);

    const slides = output.slides ?? [];
    const contentSlides = slides.filter(
      (s) => s.layout !== "capa" && s.layout !== "fechamento",
    );
    const withoutPrompt = contentSlides.filter((s) => !s.imagePrompt?.trim()).length;
    if (contentSlides.length > 0 && withoutPrompt > contentSlides.length * 0.4) {
      issues.push(
        "Slides: preencha 'imagePrompt' em todos os slides de conteúdo para imagens reais.",
      );
    }
    const withoutSequence = contentSlides.filter((s) => !s.sequenceStep).length;
    if (contentSlides.length > 2 && withoutSequence > contentSlides.length * 0.5) {
      issues.push(
        "Slides: defina 'sequenceStep' e 'sequenceLabel' em ordem pedagógica crescente.",
      );
    }
    if (slides[0]?.layout && slides[0].layout !== "capa") {
      issues.push("Slides: o primeiro slide deve ter layout 'capa'.");
    }

    if (request.incluirQuestoes) {
      const expected = request.quantidadeQuestoes ?? 3;
      const n = output.exam?.questions?.length ?? 0;
      const issue = countIssues("questões nos slides", expected, n);
      if (issue) issues.push(issue);

      const answerLeakPattern =
        /(?:^|\s)(?:gabarito|resposta\s*(?:correta|esperada)?)\s*:/i;
      const answerBulletPattern = /^quest[aã]o\s*\d+\s*:/i;

      for (let index = 0; index < slides.length - 1; index += 1) {
        const slide = slides[index];
        const chunks = [
          slide.title,
          slide.subtitle,
          ...(slide.bullets ?? []),
          slide.callout?.text,
          slide.speakerNotes,
        ]
          .filter(Boolean)
          .join("\n");

        if (answerLeakPattern.test(chunks) || answerBulletPattern.test(chunks)) {
          issues.push(
            "Slides: gabarito e respostas devem aparecer somente no último slide.",
          );
          break;
        }
      }

      if (request.incluirGabarito && n > 0) {
        const withAnswer =
          output.exam?.questions?.filter((item) => item.answer?.trim()).length ??
          0;
        if (withAnswer < Math.min(n, expected) - COUNT_TOLERANCE) {
          issues.push(
            "Slides: preencha 'answer' em cada questão e consolide o gabarito no último slide.",
          );
        }

        const lastSlide = slides[slides.length - 1];
        const lastText = [
          lastSlide?.title,
          ...(lastSlide?.bullets ?? []),
        ]
          .filter(Boolean)
          .join("\n");
        if (
          !/gabarito/i.test(lastText) &&
          !answerBulletPattern.test(lastText)
        ) {
          issues.push(
            "Slides: o último slide deve trazer o gabarito completo das questões.",
          );
        }
      }
    }
  }

  if (tipo === "flashcards") {
    const issue = countIssues("flashcards", q, output.flashcards?.length ?? 0);
    if (issue) issues.push(issue);
  }

  if (tipo === "lista") {
    const n = output.exam?.questions?.length ?? 0;
    const issue = countIssues("exercícios", q, n);
    if (issue) issues.push(issue);
    if (request.incluirGabarito && n > 0) {
      const withAnswer =
        output.exam?.questions?.filter((item) => item.answer?.trim()).length ?? 0;
      if (withAnswer < Math.min(n, q) - COUNT_TOLERANCE) {
        issues.push(
          "Gabarito: preencha o campo 'answer' em cada questão e no array 'answerKey'.",
        );
      }
    }

    const questions = output.exam?.questions ?? [];
    const normalizedStatements = questions.map((question) =>
      question.statement?.trim().toLowerCase().replace(/\s+/g, " ") || "",
    );
    const duplicateStatements = normalizedStatements.filter(
      (statement, index) =>
        statement && normalizedStatements.indexOf(statement) !== index,
    );
    if (duplicateStatements.length) {
      issues.push("Lista: enunciados repetidos — reescreva cada exercício.");
    }

    let flagged = 0;
    for (const question of questions) {
      const statement = question.statement?.trim() || "";
      if (statement.length > MAX_STATEMENT_CHARS) {
        issues.push(
          `Questão ${question.number}: enunciado longo demais — máximo 3 frases curtas e diretas.`,
        );
      } else if (countStatementSentences(statement) > 3) {
        issues.push(
          `Questão ${question.number}: limite de 3 frases no enunciado — seja mais direto.`,
        );
      }

      if (
        question.type === "multipla-escolha" &&
        (question.options?.length ?? 0) < MIN_MC_OPTIONS
      ) {
        issues.push(
          `Questão ${question.number}: múltipla escolha exige pelo menos ${MIN_MC_OPTIONS} alternativas distintas.`,
        );
      }

      for (const semantic of collectQuestionSemanticIssues({
        statement: question.statement,
        answer: question.answer,
        options: question.options,
        tema: request.tema,
        questionType: question.type,
      }).slice(0, 1)) {
        issues.push(`Questão ${question.number}: ${semantic}`);
        flagged += 1;
        if (flagged >= 4) break;
      }
      if (flagged >= 4) break;
    }

    if (tipo === "lista" && questions.length >= 3) {
      const types = questions.map((q) => q.type);
      const uniqueTypes = new Set(types);
      if (uniqueTypes.size < 2) {
        issues.push(
          "Lista: varie tipos de exercício (múltipla escolha, completar, dissertativa curta etc.).",
        );
      }
    }
  }

  if (tipo === "mapa-mental") {
    const n = output.mindMap?.branches?.length ?? 0;
    const issue = countIssues("ramos do mapa mental", q, n);
    if (issue) issues.push(issue);
    if (!output.mindMap?.central?.trim()) {
      issues.push("Mapa mental: informe o conceito central em mindMap.central.");
    }
  }

  if (tipo === "plano-aula") {
    const steps = output.lessonPlan?.steps ?? [];
    const tables = output.scheduleTables ?? [];
    const tableRows = tables.flatMap((table) => table.rows ?? []);
    const hasEnoughSteps = steps.length >= 5;
    const hasEnoughTable = tableRows.length >= 4;

    if (!hasEnoughSteps && !hasEnoughTable) {
      issues.push(
        `Plano de aula: inclua pelo menos 5 etapas em lessonPlan.steps ou cronograma com 4+ linhas (recebido ${steps.length} etapas, ${tableRows.length} linhas).`,
      );
    }

    const stageNames = [
      ...steps.map((step) => step.stage?.toLowerCase() || ""),
      ...tableRows.map((row) => String(row[0] || "").toLowerCase()),
    ].join(" ");
    if (!/abertura|in[ií]cio|acolhimento/.test(stageNames)) {
      issues.push("Plano de aula: inclua etapa de Abertura no cronograma.");
    }
    if (!/fechamento|s[ií]ntese|encerramento/.test(stageNames)) {
      issues.push("Plano de aula: inclua etapa de Fechamento no cronograma.");
    }
    if ((output.sections?.length ?? 0) < 3) {
      issues.push(
        "Plano de aula: inclua pelo menos 3 seções (objetivos, desenvolvimento, recursos/avaliação).",
      );
    }
    if ((output.activities?.length ?? 0) < 1) {
      issues.push(
        "Plano de aula: inclua pelo menos 1 atividade pedagógica aplicável em sala.",
      );
    }
    if (isGenericEducationalText(output.summary)) {
      issues.push(
        "Plano de aula: resumo inicial genérico — contextualize o tema e a turma.",
      );
    }
    for (const step of steps.slice(0, 6)) {
      const label = step.stage?.trim() || "Etapa";
      if (!step.duration?.trim()) {
        issues.push(`Plano de aula: etapa "${label}" deve informar duração.`);
      }
      if ((step.description?.trim().length ?? 0) < 40) {
        issues.push(
          `Plano de aula: etapa "${label}" precisa descrever ações do professor e dos estudantes.`,
        );
      }
      if (!(step.resources?.length ?? 0)) {
        issues.push(`Plano de aula: etapa "${label}" deve listar recursos.`);
      }
      if (issues.length >= 14) break;
    }
  }

  if (tipo === "sequencia" || tipo === "projeto" || tipo === "apostila") {
    const sections = output.sections?.length ?? 0;
    const issue = countIssues("seções", q, sections);
    if (issue) issues.push(issue);

    for (const section of (output.sections ?? []).slice(0, 6)) {
      for (const semantic of collectSectionSemanticIssues({
        title: section.title,
        content: [section.content, ...(section.bullets ?? [])].join(" "),
        tema: request.tema,
      }).slice(0, 1)) {
        issues.push(`${section.title}: ${semantic}`);
      }
    }
  }

  if (["lista", "apostila"].includes(tipo)) {
    if (tipo === "apostila" && isGenericEducationalText(output.summary)) {
      issues.push("Resumo inicial genérico — use síntese específica do tema.");
    }
    if (tipo === "lista") {
      const summary = output.summary?.trim() || "";
      if (summary.length > 120) {
        issues.push(
          "Lista: 'summary' deve ficar vazio ou ter no máximo 1 frase curta — remova contextualização longa.",
        );
      }
      if ((output.sections?.length ?? 0) > 0) {
        issues.push(
          "Lista: não use 'sections' — concentre tudo em exam.questions.",
        );
      }
      if ((output.teacherNotes?.length ?? 0) > 0) {
        issues.push(
          "Lista: não preencha 'teacherNotes' — orientações pedagógicas não entram na versão do aluno.",
        );
      }
    }
  }

  if (tipo === "atividade") {
    const activities = output.activities ?? [];
    if (activities.length === 0) {
      issues.push(`atividades: nenhum item foi gerado (esperado ${q}).`);
    } else if (activities.length !== q) {
      issues.push(`atividades: esperado exatamente ${q}, recebido ${activities.length}.`);
    }

    for (const [index, activity] of activities.entries()) {
      const n = index + 1;
      if (!activity.objective?.trim()) {
        issues.push(`Atividade ${index + 1}: preencha 'objective'.`);
      } else if ((activity.objective?.trim().length ?? 0) < 35) {
        issues.push(`Atividade ${n}: objetivo deve ser especifico e contextualizado.`);
      }
      if (!activity.estimatedTime?.trim()) {
        issues.push(`Atividade ${index + 1}: preencha 'estimatedTime'.`);
      }
      if (!activity.materials?.length) {
        issues.push(`Atividade ${index + 1}: liste 'materials' necessários.`);
      } else if (activity.materials.length < 2) {
        issues.push(`Atividade ${n}: inclua pelo menos 2 materiais ou recursos.`);
      }
      if (!activity.instructions?.trim()) {
        issues.push(`Atividade ${n}: preencha 'instructions'.`);
      } else if ((activity.instructions?.trim().length ?? 0) < 80) {
        issues.push(`Atividade ${n}: desenvolvimento deve ser mais extenso e orientar a aplicacao.`);
      }
      const items = activity.items ?? [];
      if (items.length < 5) {
        issues.push(`Atividade ${n}: inclua pelo menos 5 itens/subquestoes para o estudante.`);
      }
      const joinedItems = items.join("\n");
      for (const letter of ["a", "b", "c", "d", "e"]) {
        if (!new RegExp(`(^|\\n)\\s*${letter}\\)`, "i").test(joinedItems)) {
          issues.push(`Atividade ${n}: inclua o item ${letter}) no percurso do estudante.`);
          break;
        }
      }
      if (!activity.evaluation?.trim()) {
        issues.push(`Atividade ${index + 1}: preencha 'evaluation'.`);
      } else if ((activity.evaluation?.trim().length ?? 0) < 45) {
        issues.push(`Atividade ${n}: avaliacao deve ter criterios observaveis.`);
      }
      if (issues.length >= 12) break;
    }
  }

  if (tipo === "apostila") {
    const titles = (output.sections ?? []).map(
      (section) => section.title?.toLowerCase() || "",
    );
    if (!titles.some((title) => /apresent|introdu/.test(title))) {
      issues.push("Apostila: inclua seção de Apresentação ou Introdução.");
    }
    if (!titles.some((title) => /objetiv/.test(title))) {
      issues.push("Apostila: inclua seção de Objetivos de aprendizagem.");
    }
    const firstTitle = titles[0] || "";
    if (/quest|exerc|prova|gabarito/.test(firstTitle)) {
      issues.push(
        "Apostila: não inicie com questões — explique o conteúdo antes da prática.",
      );
    }
  }

  if (tipo === "redacao") {
    const sections = output.sections ?? [];
    const motivatorSections = sections.filter((s) =>
      s.title?.toLowerCase().includes("motivador"),
    );
    if (motivatorSections.length !== q) {
      issues.push(
        `Redação: inclua exatamente ${q} textos motivadores em sections (recebido ${motivatorSections.length}).`,
      );
    }
    const weakMotivator = motivatorSections.find(
      (section) => `${section.content || ""} ${(section.bullets ?? []).join(" ")}`.trim().length < 120,
    );
    if (weakMotivator) {
      issues.push("Redação: textos motivadores devem ter contexto e recorte suficientes.");
    }
    const commandSection = sections.find((section) =>
      /tema|comando|proposta|produ[cç][aã]o/i.test(
        `${section.title || ""} ${section.content || ""} ${(section.bullets ?? []).join(" ")}`,
      ),
    );
    if (!commandSection) {
      issues.push("Redação: inclua seção com tema e comando de produção.");
    }
    const criteriaText = (output.teacherNotes ?? []).join(" ");
    if (!output.teacherNotes?.length || criteriaText.trim().length < 80) {
      issues.push(
        "Redação: inclua critérios de avaliação completos em teacherNotes.",
      );
    } else if (
      !/tema|argumenta[cç][aã]o|coes[aã]o|linguagem|repert[oó]rio/i.test(criteriaText)
    ) {
      issues.push("Redação: critérios devem citar tema, argumentação, coesão, linguagem ou repertório.");
    }
  }

  if (tipo === "jogo") {
    if (!output.game?.rules?.length) {
      issues.push("Jogo: preencha game.rules com passo a passo de aplicação.");
    }
    if (!output.game?.components?.length) {
      issues.push("Jogo: preencha game.components com materiais necessários.");
    }
  }

  if (tipo === "cruzadinha") {
    const minTerms = Math.min(Math.max(q, 8), 15);
    const components = output.game?.components ?? [];
    const parsedComponents = components.map(parseCruzadinhaComponent);
    const distinctTerms = new Set(
      parsedComponents
        .map((item) => item.normalizedTerm)
        .filter(Boolean),
    );

    if (distinctTerms.size < minTerms) {
      issues.push(
        `Cruzadinha: inclua pelo menos ${minTerms} termos distintos com pistas em game.components (formato PALAVRA: pista).`,
      );
    }

    const malformed = parsedComponents.filter(
      (item) =>
        !item.normalizedTerm ||
        item.normalizedTerm.length < 3 ||
        item.normalizedTerm.length > 13 ||
        /\s/.test(item.term.trim()) ||
        item.clue.length < 24,
    );
    if (malformed.length) {
      issues.push(
        "Cruzadinha: cada componente deve seguir PALAVRA: pista contextual, com termo sem espaços e pista com contexto suficiente.",
      );
    }

    const duplicateCount = parsedComponents.length - distinctTerms.size;
    if (duplicateCount > 0) {
      issues.push("Cruzadinha: remova termos repetidos ou equivalentes no banco de palavras.");
    }

    const genericTerms = new Set([
      "CONCEITO",
      "EXEMPLO",
      "TEMA",
      "ATIVIDADE",
      "CONTEUDO",
      "PALAVRA",
      "PERGUNTA",
      "RESPOSTA",
    ]);
    const genericCount = parsedComponents.filter((item) =>
      genericTerms.has(item.normalizedTerm),
    ).length;
    if (genericCount > 1) {
      issues.push(
        "Cruzadinha: substitua termos genéricos por conceitos específicos do conteúdo.",
      );
    }

    const revealingClues = parsedComponents.filter(
      (item) =>
        item.normalizedTerm.length > 3 &&
        normalizeCruzadinhaTerm(item.clue).includes(item.normalizedTerm),
    );
    if (revealingClues.length) {
      issues.push("Cruzadinha: reescreva pistas que repetem ou entregam a resposta.");
    }

    const normalizedClues = parsedComponents.map((item) =>
      item.clue.trim().toLocaleLowerCase("pt-BR").replace(/\s+/g, " "),
    );
    const duplicateClues = normalizedClues.filter(
      (clue, index) => clue && normalizedClues.indexOf(clue) !== index,
    );
    if (duplicateClues.length) {
      issues.push("Cruzadinha: varie as pistas; não repita a mesma definição.");
    }

    if (!output.game?.rules?.length) {
      issues.push("Cruzadinha: preencha game.rules com orientações de aplicação em sala.");
    }
  }

  if (tipo === "resumo") {
    if ((output.sections?.length ?? 0) < 2) {
      issues.push("Resumo: organize pelo menos 2 seções temáticas com bullets.");
    }
    const longParagraphs = (output.sections ?? []).filter(
      (section) => (section.content?.trim().length ?? 0) > 180,
    ).length;
    if (longParagraphs > 0) {
      issues.push(
        "Resumo: use bullets curtos — evite parágrafos explicativos longos em 'content'.",
      );
    }
    if ((output.exam?.questions?.length ?? 0) > 0) {
      issues.push("Resumo: não inclua exam.questions — use apenas sections com bullets.");
    }
  }

  return issues;
}

export function buildQualityRetryPrompt(
  request: MaterialEngineRequest,
  issues: string[],
  options?: { teachyDepth?: boolean },
): string {
  return [
    "A entrega anterior não atendeu o contrato pedagógico. Corrija e regenere o JSON completo.",
    "",
    "Problemas detectados:",
    ...issues.map((item) => `- ${item}`),
    "",
    `Tipo: ${request.tipoMaterial}`,
    `Quantidade obrigatória: ${request.quantidade}`,
    `Incluir gabarito: ${request.incluirGabarito ? "sim" : "não"}`,
    ...(request.incluirQuestoes
      ? [
          `Questões nos slides: ${request.quantidadeQuestoes ?? 3}`,
          request.incluirGabarito
            ? "Gabarito obrigatório somente no último slide."
            : "Sem gabarito em nenhum slide.",
        ]
      : []),
    `Tema obrigatório: "${request.tema}".`,
    request.tipoMaterial === "atividade"
      ? "Reescreva o JSON MaterialLayout completo: cada atividade deve ter objetivo contextualizado, materiais, desenvolvimento extenso, avaliacao observavel e pelo menos 5 itens do estudante rotulados a), b), c), d), e)."
      : request.tipoMaterial === "plano-aula"
        ? "Reescreva o JSON MaterialLayout completo: lessonPlan.steps (5+ etapas), scheduleTables cronometrada, sections (objetivos, desenvolvimento, recursos), activities (1+ com itens a)-e)) e descrições concretas para sala."
        : request.tipoMaterial === "redacao"
          ? "Reescreva o JSON MaterialLayout completo: textos motivadores distintos, tema/comando claro e critérios de avaliação completos em teacherNotes."
      : request.tipoMaterial === "cruzadinha"
            ? "Reescreva o JSON MaterialLayout completo: game.components com PALAVRA: pista (mínimo solicitado), termos específicos do tema, sem duplicatas, sem termos genéricos e sem pistas que revelem a resposta."
            : request.tipoMaterial === "prova" || request.tipoMaterial === "lista"
              ? "Reescreva o JSON MaterialLayout completo: enunciados contextualizados, 5 alternativas distintas (35+ chars), gabarito enxuto (respostaCorreta+justificativa ≤120 caracteres) e zero texto genérico."
              : "Reescreva o JSON MaterialLayout completo com enunciados contextualizados, 5 alternativas (A-E) distintas e gabarito objetivo.",
    ...(options?.teachyDepth ? ["", TEACHY_QUALITY_RULES] : []),
  ].join("\n");
}
