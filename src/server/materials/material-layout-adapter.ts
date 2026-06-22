/**
 * Adapter MaterialLayout (motor unificado) → MaterialEngineResponse (renderer legado).
 */

import type {
  MaterialEngineRequest,
  MaterialEngineResponse,
  MaterialEngineType,
  ExamQuestion,
} from "./material-engine-types";
import type {
  MaterialLayout,
  MaterialSecao,
  PromptEngineInput,
  QuestaoItem,
  TipoFerramenta,
} from "./types";
import {
  isQuestoesConteudo,
  isSlideConteudo,
  isTabelaConteudo,
  isTextoConteudo,
} from "./types";
import { assertKnownToolType } from "./validator";

const TYPE_TITLES: Record<MaterialEngineType, string> = {
  apostila: "Apostila",
  atividade: "Atividade",
  prova: "Prova",
  slides: "Apresentação",
  projeto: "Projeto",
  jogo: "Jogo pedagógico",
  cruzadinha: "Cruzadinha pedagógica",
  sequencia: "Sequência didática",
  resumo: "Resumo",
  lista: "Lista de exercícios",
  "plano-aula": "Plano de aula",
  flashcards: "Flashcards",
  redacao: "Proposta de redação",
  "mapa-mental": "Mapa mental",
};

export function toPromptEngineInput(request: MaterialEngineRequest): PromptEngineInput {
  return {
    tipoFerramenta: assertKnownToolType(request.tipoMaterial) as TipoFerramenta,
    etapa: request.etapa,
    anoSerie: request.anoSerie,
    componenteCurricular: request.componenteCurricular,
    tema: request.tema,
    objetivo: request.objetivo,
    quantidade: request.quantidade,
    dificuldade: request.dificuldade,
    incluirGabarito: request.incluirGabarito,
    incluirQuestoes: request.incluirQuestoes,
    quantidadeQuestoes: request.quantidadeQuestoes,
    designSlides: request.designSlides,
    modeloSlides: request.modeloSlides,
    formatoJogo: request.formatoJogo,
    observacoes: request.observacoes,
    habilidadesBncc: request.habilidadesSelecionadas?.map((skill) => ({
      codigo: skill.codigo,
      descricao: skill.descricao,
      conteudo: skill.conteudo,
    })),
  };
}

function parseFlashcardPair(bullet: string): { front: string; back: string } | null {
  const match = bullet.match(/^\s*frente\s*:\s*(.+?)\s*\|\s*verso\s*:\s*(.+)\s*$/i);
  if (!match) return null;
  return { front: match[1].trim(), back: match[2].trim() };
}

function questaoToExamQuestion(questao: QuestaoItem) {
  const options = (questao.alternativas ?? [])
    .sort((a, b) => a.letra.localeCompare(b.letra))
    .map((alt) => String(alt.texto || "").trim())
    .filter(Boolean);

  const answer = [questao.respostaCorreta, questao.justificativa]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" — ");

  return {
    number: questao.numero,
    type: questao.tipo,
    statement: questao.enunciado,
    options,
    answer,
  };
}

function tabelaToLessonSteps(secao: MaterialSecao) {
  if (!isTabelaConteudo(secao.conteudo, secao.tipo)) return [];

  const headers = (secao.conteudo.cabecalhos ?? []).map((h) => h.toLowerCase());
  const findCol = (needles: string[]) =>
    headers.findIndex((header) => needles.some((needle) => header.includes(needle)));

  const stageCol = findCol(["etapa", "momento", "fase"]);
  const durationCol = findCol(["dura", "tempo"]);
  const activityCol = findCol(["atividade", "ação", "acao", "descri"]);
  const resourcesCol = findCol(["recurso", "material"]);

  return (secao.conteudo.linhas ?? []).map((row, index) => ({
    stage: row[stageCol >= 0 ? stageCol : 0] || `Etapa ${index + 1}`,
    duration: row[durationCol >= 0 ? durationCol : 1] || "",
    description: row[activityCol >= 0 ? activityCol : 2] || row.join(" — "),
    resources:
      resourcesCol >= 0 && row[resourcesCol]
        ? [row[resourcesCol]]
        : row.slice(3).filter(Boolean),
  }));
}

function tabelaToSectionContent(secao: MaterialSecao): string {
  if (!isTabelaConteudo(secao.conteudo, secao.tipo)) return "";
  const headers = secao.conteudo.cabecalhos ?? [];
  const rows = secao.conteudo.linhas ?? [];
  return rows
    .map((row) =>
      headers.map((header, index) => `${header}: ${row[index] ?? ""}`).join(" | "),
    )
    .join("\n");
}

function extractGameFromSecoes(secoes: MaterialSecao[], formato: string | null | undefined) {
  let rules: string[] = [];
  let components: string[] = [];

  for (const secao of secoes) {
    if (!isTextoConteudo(secao.conteudo, secao.tipo)) continue;
    const title = secao.titulo.toLowerCase();
    const bullets = secao.conteudo.bullets ?? [];
    const paragraphs = secao.conteudo.paragrafos ?? [];

    if (/regra/.test(title)) {
      rules = [...rules, ...bullets, ...paragraphs];
    } else if (/component|material|cart|peça|peca|termo/.test(title)) {
      components = [...components, ...bullets, ...paragraphs];
    }
  }

  if (!rules.length && !components.length) return undefined;

  return {
    format: formato || "jogo pedagógico",
    rules: rules.filter(Boolean),
    components: components.filter(Boolean),
  };
}

function textoSecaoToActivity(secao: MaterialSecao) {
  if (!isTextoConteudo(secao.conteudo, secao.tipo)) return null;

  const bullets = secao.conteudo.bullets ?? [];
  const paragraphs = secao.conteudo.paragrafos ?? [];
  const materials = bullets.filter((item) => /^material/i.test(item));
  const steps = bullets.filter((item) => !/^material/i.test(item));

  return {
    title: secao.titulo,
    objective: paragraphs[0] || "",
    estimatedTime: bullets.find((item) => /minuto|hora|tempo/i.test(item)) || "",
    materials: materials.map((item) => item.replace(/^materiais?\s*:\s*/i, "")),
    instructions: paragraphs.slice(1).join(" ") || bullets[0] || "",
    items: steps.length ? steps : bullets,
    evaluation: bullets.find((item) => /avalia/i.test(item)) || "",
  };
}

/**
 * Converte MaterialLayout validado para a estrutura consumida pelo renderer HTML legado.
 */
export function materialLayoutToEngineResponse(
  layout: MaterialLayout,
  request: MaterialEngineRequest,
): Partial<MaterialEngineResponse> {
  const tipo = request.tipoMaterial;
  const typeTitle = TYPE_TITLES[tipo] || "Material";

  const sections: MaterialEngineResponse["sections"] = [];
  const activities: MaterialEngineResponse["activities"] = [];
  const teacherNotes: string[] = [];
  const answerKey: string[] = [];
  let examQuestions: ExamQuestion[] = [];
  let slides: NonNullable<MaterialEngineResponse["slides"]> = [];
  let flashcards: NonNullable<MaterialEngineResponse["flashcards"]> = [];
  let lessonSteps: NonNullable<MaterialEngineResponse["lessonPlan"]>["steps"] = [];
  const scheduleTables: NonNullable<MaterialEngineResponse["scheduleTables"]> = [];
  let mindMapCentral = layout.metadata.tema;
  const mindMapBranches: Array<{ title: string; items: string[] }> = [];

  const usesScheduleTables =
    tipo === "plano-aula" || tipo === "sequencia" || tipo === "projeto";

  for (const secao of layout.secoes) {
    if (isTextoConteudo(secao.conteudo, secao.tipo)) {
      const content = (secao.conteudo.paragrafos ?? []).join("\n\n");
      const bullets = secao.conteudo.bullets ?? [];

      if (tipo === "flashcards") {
        for (const bullet of bullets) {
          const pair = parseFlashcardPair(bullet);
          if (pair) {
            flashcards.push(pair);
            continue;
          }
          flashcards.push({ front: bullet, back: "" });
        }
        continue;
      }

      if (tipo === "atividade") {
        const activity = textoSecaoToActivity(secao);
        if (activity) activities.push(activity);
        continue;
      }

      if (tipo === "mapa-mental") {
        if (sections.length === 0) {
          mindMapCentral = secao.titulo || layout.metadata.tema;
        } else {
          mindMapBranches.push({
            title: secao.titulo,
            items: bullets.length ? bullets : secao.conteudo.paragrafos ?? [],
          });
        }
      }

      sections.push({
        title: secao.titulo,
        content,
        bullets,
      });

      if (/nota|critério|criterio|professor|avalia/i.test(secao.titulo)) {
        teacherNotes.push(...bullets, ...secao.conteudo.paragrafos ?? []);
      }
    }

    if (isTabelaConteudo(secao.conteudo, secao.tipo)) {
      const headers = (secao.conteudo.cabecalhos ?? [])
        .map((header) => String(header).trim())
        .filter(Boolean);
      const rows = (secao.conteudo.linhas ?? [])
        .map((row) => row.map((cell) => String(cell ?? "").trim()))
        .filter((row) => row.some((cell) => cell.length > 0));

      if (headers.length && rows.length) {
        scheduleTables.push({
          title: secao.titulo.trim() || "Cronograma",
          headers,
          rows,
        });
      }

      if (usesScheduleTables) {
        lessonSteps = [...lessonSteps, ...tabelaToLessonSteps(secao)];
        continue;
      }

      sections.push({
        title: secao.titulo,
        content: tabelaToSectionContent(secao),
        bullets: rows.map((row) => row.join(" | ")),
      });
    }

    if (isQuestoesConteudo(secao.conteudo, secao.tipo)) {
      const mapped = (secao.conteudo.questoes ?? []).map((questao) =>
        questaoToExamQuestion(questao as QuestaoItem),
      );
      examQuestions = [...examQuestions, ...mapped];

      const itemLabel = tipo === "lista" ? "Exercício" : "Questão";
      for (const questao of secao.conteudo.questoes ?? []) {
        const q = questao as QuestaoItem;
        if (!q.respostaCorreta?.trim()) continue;
        const line = q.justificativa?.trim()
          ? `${q.respostaCorreta} — ${q.justificativa.trim()}`
          : q.respostaCorreta;
        answerKey.push(`${itemLabel} ${q.numero}: ${line}`);
      }
    }

    if (isSlideConteudo(secao.conteudo, secao.tipo)) {
      slides = [
        ...slides,
        ...(secao.conteudo.slides ?? []).map((slide, index) => ({
          title: slide.titulo,
          bullets: slide.topicos ?? [],
          speakerNotes: slide.notasProfessor || "",
          layout: slide.layout,
          imagePrompt: slide.imagePrompt,
          sequenceStep: index,
        })),
      ];
    }
  }

  if (layout.metadata.habilidadeBNCC?.trim()) {
    teacherNotes.unshift(
      `BNCC ${layout.metadata.codigoBNCC}: ${layout.metadata.habilidadeBNCC}`.trim(),
    );
  }

  const directMaterial = tipo === "prova" || tipo === "lista";
  const summary = directMaterial
    ? ""
    : `${typeTitle} sobre ${layout.metadata.tema} — ${layout.metadata.serie}.`;

  const response: Partial<MaterialEngineResponse> = {
    title: `${typeTitle} — ${layout.metadata.tema}`,
    subtitle: `${request.componenteCurricular} • ${request.anoSerie}`,
    summary,
    sections: directMaterial ? [] : sections,
    activities,
    answerKey,
    teacherNotes: directMaterial ? [] : [...new Set(teacherNotes.filter(Boolean))],
    exam: examQuestions.length ? { questions: examQuestions } : undefined,
    slides: slides.length ? slides : undefined,
    flashcards: flashcards.length ? flashcards : undefined,
    lessonPlan: lessonSteps.length ? { steps: lessonSteps } : undefined,
    scheduleTables: scheduleTables.length ? scheduleTables : undefined,
    mindMap:
      tipo === "mapa-mental"
        ? {
            central: mindMapCentral,
            branches:
              mindMapBranches.length > 0
                ? mindMapBranches
                : sections.slice(1).map((section) => ({
                    title: section.title,
                    items: section.bullets ?? [],
                  })),
          }
        : undefined,
    game:
      tipo === "jogo" || tipo === "cruzadinha"
        ? extractGameFromSecoes(layout.secoes, request.formatoJogo)
        : undefined,
  };

  return response;
}
