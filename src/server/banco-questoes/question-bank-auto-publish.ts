import { computeQuestionContentHash } from "@/lib/banco-questoes/question-bank-hash";
import { isQuestionSelfContained } from "@/lib/banco-questoes/question-bank-self-contained";
import type {
  ExamQuestion,
  MaterialEngineInput,
} from "@/server/materials/material-engine-types";
import { normalizeMaterialEngineRequest } from "@/server/materials/material-engine-validation";
import {
  publishToCommunity,
  upsertUserQuestion,
} from "./question-bank-db-service";

const AUTO_COMMUNITY_QUALITY = 88;

function examQuestionToBankItem(
  question: ExamQuestion,
  request: ReturnType<typeof normalizeMaterialEngineRequest>,
  sourceType: string,
) {
  const enunciado = String(question.statement || "").trim();
  if (enunciado.length < 20) return null;
  if (!isQuestionSelfContained(enunciado).ok) return null;

  const options = Array.isArray(question.options)
    ? question.options.map((o) => String(o).trim()).filter(Boolean)
    : [];
  const isMc =
    question.type === "multipla-escolha" ||
    question.type === "verdadeiro-falso" ||
    options.length >= 3;
  const answer = String(question.answer || "").trim();
  if (!answer) return null;

  const tipo = isMc ? "multipla-escolha" : "discursiva";

  return {
    enunciado,
    tipo,
    alternativas: isMc ? options : [],
    respostaEsperada: answer,
    criterioCorrecao: answer,
    componente: request.componenteCurricular || "Multicomponente",
    anoSerie: request.anoSerie || "Geral",
    etapa: request.etapa || "",
    tema: request.tema || "",
    bnccCodigos: (request.habilidadesSelecionadas ?? []).map((skill) => skill.codigo),
    tags: ["auto-ingest", request.tipoMaterial],
    sourceTitle: `${request.tipoMaterial} Planify`,
    sourceType,
    contentHash: computeQuestionContentHash(enunciado, tipo),
  };
}

/**
 * Ciclo Teachy: toda lista/prova boa volta ao banco para reutilização.
 */
export async function autoPublishExamToQuestionBank(input: {
  userId: string;
  engineInput: MaterialEngineInput;
  questions: ExamQuestion[];
  qualityScore: number;
  pipeline: string;
}): Promise<{ saved: number; published: number }> {
  if (!input.questions.length || input.qualityScore < 80) {
    return { saved: 0, published: 0 };
  }

  const request = normalizeMaterialEngineRequest(input.engineInput);
  const sourceType =
    input.pipeline.startsWith("bank")
      ? "planify:bank-reuse"
      : "planify:generation";

  let saved = 0;
  let published = 0;

  for (const question of input.questions) {
    const item = examQuestionToBankItem(question, request, sourceType);
    if (!item) continue;

    try {
      const { item: stored, duplicate } = await upsertUserQuestion(input.userId, item);
      if (!duplicate) saved += 1;

      if (
        input.qualityScore >= AUTO_COMMUNITY_QUALITY &&
        !duplicate &&
        item.respostaEsperada.length >= 2
      ) {
        try {
          await publishToCommunity(input.userId, stored.id);
          published += 1;
        } catch {
          // publicação opcional — não bloqueia geração
        }
      }
    } catch {
      // best-effort
    }
  }

  return { saved, published };
}
