import { appendFileSync } from "node:fs";
import { join } from "node:path";
import { stripTeacherOnlyExportBlocks } from "../editor/prepare-export-html";
import { ExportHttpError } from "../export/export-error-service";
import { logOperationalEvent } from "../telemetry/operational-telemetry";
import type { ParsedQuizQuestion } from "./parse-quiz-from-html";
import { parseQuizQuestionsFromHtml } from "./parse-quiz-from-html";
import { assertFormsScopeForExport } from "./google-forms-scope";
import { getValidGoogleAccessToken } from "./google-token-store";

function agentDebugLog(message: string, data: Record<string, unknown>): void {
  try {
    appendFileSync(
      join(process.cwd(), "debug-a1058c.log"),
      `${JSON.stringify({
        sessionId: "a1058c",
        location: "google-forms-export-service.ts",
        message,
        data,
        timestamp: Date.now(),
      })}\n`,
    );
  } catch {
    // ignore
  }
}

function safeFilename(value: string): string {
  const cleaned = String(value || "formulario-planify")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 80);

  return cleaned || "formulario-planify";
}

function buildFormItemRequest(question: ParsedQuizQuestion, index: number) {
  const isChoice =
    question.type === "multipla-escolha" ||
    question.type === "verdadeiro-falso" ||
    (question.options.length >= 2 && question.type !== "dissertativa");

  if (isChoice) {
    const options =
      question.type === "verdadeiro-falso" && question.options.length < 2
        ? [{ value: "Verdadeiro" }, { value: "Falso" }]
        : question.options
            .map((option) => ({ value: option.trim() }))
            .filter((option) => option.value.length > 0);

    if (options.length >= 2) {
      return {
        createItem: {
          item: {
            title: question.statement,
            questionItem: {
              question: {
                required: false,
                choiceQuestion: {
                  type: "RADIO",
                  options,
                },
              },
            },
          },
          location: { index },
        },
      };
    }
  }

  return {
    createItem: {
      item: {
        title: question.statement,
        questionItem: {
          question: {
            required: false,
            textQuestion: {
              paragraph: question.type === "completar",
            },
          },
        },
      },
      location: { index },
    },
  };
}

export type GoogleFormsExportInput = {
  title: string;
  html: string;
  description?: string;
};

export type GoogleFormsExportResult = {
  formId: string;
  formUrl: string;
  responderUrl: string;
  questionCount: number;
  googleEmail: string | null;
};

export function countQuizQuestionsFromHtml(html: string): number {
  return parseQuizQuestionsFromHtml(stripTeacherOnlyExportBlocks(html)).length;
}

export async function exportQuizToGoogleForms(
  userId: string,
  input: GoogleFormsExportInput,
): Promise<GoogleFormsExportResult> {
  const startedAt = Date.now();
  const title = String(input.title || "Formulário Planify").trim() || "Formulário Planify";
  const html = String(input.html || "").trim();

  if (!html) {
    throw new Error("Conteúdo do documento vazio.");
  }

  const questions = parseQuizQuestionsFromHtml(stripTeacherOnlyExportBlocks(html));

  // #region agent log
  agentDebugLog("parseQuestions", {
    hypothesisId: "B",
    questionCount: questions.length,
    htmlLen: html.length,
    hasQuestaoClass: /planify-questao/i.test(html),
  });
  // #endregion

  if (!questions.length) {
    logOperationalEvent({
      eventType: "export_failed",
      toolTipo: "google-forms",
      ok: false,
      errorCode: "no_questions",
      metadata: { htmlLen: html.length, hasQuestaoClass: /planify-questao/i.test(html) },
    });
    throw new Error(
      "Nenhuma questão encontrada no formato do Planify. Gere uma prova ou lista com questões estruturadas antes de exportar.",
    );
  }

  const { accessToken, googleEmail } = await getValidGoogleAccessToken(userId);
  await assertFormsScopeForExport(userId, accessToken);

  const description =
    input.description?.trim() || "Formulário criado pelo Planify.";

  const createResponse = await fetch("https://forms.googleapis.com/v1/forms", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      info: {
        title,
        documentTitle: safeFilename(title),
        description,
      },
    }),
  });

  const createData = (await createResponse.json()) as {
    formId?: string;
    responderUri?: string;
    error?: { message?: string };
  };

  if (!createResponse.ok || !createData.formId) {
    const message =
      createData.error?.message ||
      "Não foi possível criar o formulário no Google Forms.";

    // #region agent log
    agentDebugLog("createFailed", {
      hypothesisId: "D",
      status: createResponse.status,
      message,
    });
    // #endregion

    logOperationalEvent({
      eventType: "export_failed",
      toolTipo: "google-forms",
      ok: false,
      errorCode: "forms_create",
      durationMs: Date.now() - startedAt,
      metadata: { status: createResponse.status, questionCount: questions.length },
    });

    throw new ExportHttpError(message, createResponse.status || 502);
  }

  const requests = questions.map((question, index) =>
    buildFormItemRequest(question, index),
  );

  const batchResponse = await fetch(
    `https://forms.googleapis.com/v1/forms/${createData.formId}:batchUpdate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ requests }),
    },
  );

  const batchData = (await batchResponse.json()) as {
    error?: { message?: string };
  };

  if (!batchResponse.ok) {
    const message =
      batchData.error?.message ||
      "Formulário criado, mas não foi possível adicionar as questões.";

    // #region agent log
    agentDebugLog("batchUpdateFailed", {
      hypothesisId: "D",
      status: batchResponse.status,
      message,
      requestCount: requests.length,
    });
    // #endregion

    logOperationalEvent({
      eventType: "export_failed",
      toolTipo: "google-forms",
      ok: false,
      errorCode: "forms_batch_update",
      durationMs: Date.now() - startedAt,
      metadata: {
        status: batchResponse.status,
        questionCount: questions.length,
        formId: createData.formId,
      },
    });

    throw new ExportHttpError(message, batchResponse.status || 502);
  }

  const formId = createData.formId;
  const formUrl = `https://docs.google.com/forms/d/${formId}/edit`;
  const responderUrl =
    createData.responderUri || `https://docs.google.com/forms/d/${formId}/viewform`;

  // #region agent log
  agentDebugLog("exportSuccess", {
    hypothesisId: "A",
    formId,
    questionCount: questions.length,
    runId: "post-fix",
  });
  // #endregion

  return {
    formId,
    formUrl,
    responderUrl,
    questionCount: questions.length,
    googleEmail,
  };
}
