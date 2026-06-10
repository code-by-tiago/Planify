import {
  collectQuestionSemanticIssues,
  collectSectionSemanticIssues,
  isGenericEducationalText,
} from "@/lib/materiais/material-semantic-quality";
import type {
  MaterialEngineRequest,
  MaterialEngineResponse,
} from "./material-engine-types";

const COUNT_TOLERANCE = 1;

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

export function getEngineOutputIssues(
  request: MaterialEngineRequest,
  output: MaterialEngineResponse,
): string[] {
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

  if (tipo === "prova" || tipo === "lista") {
    const n = output.exam?.questions?.length ?? 0;
    const issue = countIssues(tipo === "lista" ? "exercícios" : "questões", q, n);
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
      issues.push("Prova/lista: enunciados repetidos — reescreva cada questão.");
    }

    if (tipo === "prova" && q >= 2) {
      const types = new Set(questions.map((question) => question.type));
      const hasObjective = [...types].some((type) =>
        ["multipla-escolha", "verdadeiro-falso", "completar"].includes(type),
      );
      const hasDiscursive = types.has("dissertativa");
      if (!hasObjective || !hasDiscursive) {
        issues.push(
          "Prova: inclua questões objetivas e pelo menos uma dissertativa.",
        );
      }
    }

    let flagged = 0;
    for (const question of questions) {
      for (const semantic of collectQuestionSemanticIssues({
        statement: question.statement,
        answer: question.answer,
        options: question.options,
        tema: request.tema,
      }).slice(0, 2)) {
        issues.push(`Questão ${question.number}: ${semantic}`);
        flagged += 1;
        if (flagged >= 6) break;
      }
      if (flagged >= 6) break;
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
    if (steps.length < 5) {
      issues.push(
        `Plano de aula: inclua pelo menos 5 etapas em lessonPlan.steps (recebido ${steps.length}).`,
      );
    }
    const stageNames = steps.map((step) => step.stage?.toLowerCase() || "").join(" ");
    if (!/abertura|in[ií]cio|acolhimento/.test(stageNames)) {
      issues.push("Plano de aula: inclua etapa de Abertura em lessonPlan.steps.");
    }
    if (!/fechamento|s[ií]ntese|encerramento/.test(stageNames)) {
      issues.push("Plano de aula: inclua etapa de Fechamento em lessonPlan.steps.");
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

  if (["prova", "lista", "apostila"].includes(tipo)) {
    if (tipo !== "prova" && tipo !== "lista" && isGenericEducationalText(output.summary)) {
      issues.push("Resumo inicial genérico — use síntese específica do tema.");
    }
    if (tipo === "prova" || tipo === "lista") {
      const summary = output.summary?.trim() || "";
      if (summary.length > 120) {
        issues.push(
          "Prova/lista: 'summary' deve ficar vazio ou ter no máximo 1 frase curta — remova contextualização longa.",
        );
      }
      if ((output.sections?.length ?? 0) > 0) {
        issues.push(
          "Prova/lista: não use 'sections' — concentre tudo em exam.questions.",
        );
      }
      if ((output.teacherNotes?.length ?? 0) > 0) {
        issues.push(
          "Prova/lista: não preencha 'teacherNotes' — orientações pedagógicas não entram na versão do aluno.",
        );
      }
    }
  }

  if (tipo === "atividade") {
    const activities = output.activities ?? [];
    const issue = countIssues("atividades", q, activities.length);
    if (issue) issues.push(issue);

    for (const [index, activity] of activities.entries()) {
      if (!activity.objective?.trim()) {
        issues.push(`Atividade ${index + 1}: preencha 'objective'.`);
      }
      if (!activity.estimatedTime?.trim()) {
        issues.push(`Atividade ${index + 1}: preencha 'estimatedTime'.`);
      }
      if (!activity.materials?.length) {
        issues.push(`Atividade ${index + 1}: liste 'materials' necessários.`);
      }
      if (!activity.evaluation?.trim()) {
        issues.push(`Atividade ${index + 1}: preencha 'evaluation'.`);
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
    const motivadores =
      output.sections?.filter((s) => s.title?.toLowerCase().includes("motivador"))
        .length ?? output.sections?.length ?? 0;
    if (motivadores < q - COUNT_TOLERANCE) {
      issues.push(
        `Redação: inclua pelo menos ${q} textos motivadores em sections (recebido ${motivadores}).`,
      );
    }
    if (!output.teacherNotes?.length) {
      issues.push(
        "Redação: inclua critérios de avaliação em teacherNotes.",
      );
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

const TEACHY_DEPTH_CHECKLIST = [
  "MODO TEACHY — CHECKLIST DE PROFUNDIDADE (última tentativa):",
  "- Material direto: questões/exercícios numerados sem preâmbulos pedagógicos longos.",
  "- Cada enunciado cita subconceito concreto do tema (zero placeholders genéricos).",
  "- Progressão: básico → intermediário → desafio.",
  "- Gabarito objetivo: resposta correta + critério breve (sem comentário pedagógico extenso).",
  "- Vocabulário e complexidade compatíveis com ano/série informados.",
  "- Quantidade e formato exatos do contrato (questões, slides, cards, seções).",
  "- Zero repetição de parágrafos ou enunciados equivalentes.",
].join("\n");

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
    "Reescreva com enunciados contextualizados, alternativas distintas e gabarito objetivo.",
    ...(options?.teachyDepth ? ["", TEACHY_DEPTH_CHECKLIST] : []),
  ].join("\n");
}
