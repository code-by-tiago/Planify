import {
  normalizeQuestionOptions,
  renderGabaritoTable,
  renderQuestionCard,
  wrapProfessionalDocument,
} from "@/lib/materiais/material-document-layout";
import type { LessonSimulatorLista } from "./lesson-simulator-service";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function questionTypeLabel(type: string): string {
  switch (type) {
    case "multipla-escolha":
      return "Múltipla escolha";
    case "verdadeiro-falso":
      return "Verdadeiro ou falso";
    case "complete":
      return "Complete";
    default:
      return "Responda";
  }
}

export function buildLessonSimulatorListaHtml(
  lista: LessonSimulatorLista,
  theme: string,
): string {
  const questionsHtml = lista.questions
    .map((question) => {
      const options =
        question.type === "multipla-escolha" || question.type === "verdadeiro-falso"
          ? normalizeQuestionOptions(
              question.options?.length
                ? question.options
                : question.type === "verdadeiro-falso"
                  ? ["Verdadeiro", "Falso"]
                  : undefined,
            )
          : undefined;

      return renderQuestionCard({
        number: question.number,
        statement: question.statement,
        options,
        questionType: questionTypeLabel(question.type),
        label: "Exercício",
        compact: true,
      });
    })
    .join("");

  const instructions = lista.instructions
    ? `<p class="planify-doc-summary">${escapeHtml(lista.instructions)}</p>`
    : "";

  const bncc = lista.bnccHint
    ? `<p class="planify-resumo-lead"><strong>BNCC sugerida:</strong> ${escapeHtml(lista.bnccHint)}</p>`
    : "";

  const body = `
    <h1 class="planify-doc-title">${escapeHtml(lista.title)}</h1>
    ${instructions}
    ${bncc}
    <section class="planify-questoes-block planify-questoes-block-direct">
      ${questionsHtml}
    </section>
    ${renderGabaritoTable(lista.answerKey)}
  `;

  return wrapProfessionalDocument(
    {
      title: lista.title,
      tipo: "lista",
      tema: theme,
      summary: lista.instructions,
      request: {
        componenteCurricular: lista.componenteCurricular,
        anoSerie: lista.anoSerie,
        etapa: lista.etapa,
      },
    },
    body,
  );
}
