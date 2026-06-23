import { stripTeacherOnlyExportBlocks } from "../editor/prepare-export-html";
import { ExportHttpError } from "../export/export-error-service";
import type { ParsedQuizQuestion } from "./parse-quiz-from-html";
import { parseQuizQuestionsFromHtml } from "./parse-quiz-from-html";
import { hasGoogleFormsScope } from "./google-config";
import { getValidGoogleAccessToken, getGoogleTokensForUser } from "./google-token-store";

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
  if (
    question.type === "multipla-escolha" ||
    question.type === "verdadeiro-falso" ||
    (question.options.length >= 2 && question.type !== "dissertativa")
  ) {
    const options =
      question.type === "verdadeiro-falso" && question.options.length < 2
        ? [{ value: "Verdadeiro" }, { value: "Falso" }]
        : question.options.map((option) => ({ value: option }));

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

export async function exportQuizToGoogleForms(
  userId: string,
  input: GoogleFormsExportInput,
): Promise<GoogleFormsExportResult> {
  const stored = await getGoogleTokensForUser(userId);
  if (stored && !hasGoogleFormsScope(stored.scopes || [])) {
    throw new Error(
      "Reconecte o Google para autorizar o Google Forms.",
    );
  }

  const { accessToken, googleEmail } = await getValidGoogleAccessToken(userId);
  const title = String(input.title || "Formulário Planify").trim() || "Formulário Planify";
  const html = String(input.html || "").trim();

  if (!html) {
    throw new Error("Conteúdo do documento vazio.");
  }

  const questions = parseQuizQuestionsFromHtml(stripTeacherOnlyExportBlocks(html));

  // #region agent log
  fetch("http://127.0.0.1:7453/ingest/bd608440-c83f-44b6-8664-8f8ef1293166", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "335b85" },
    body: JSON.stringify({
      sessionId: "335b85",
      runId: "forms-export",
      hypothesisId: "H1",
      location: "google-forms-export-service.ts:parse",
      message: "forms_parse_result",
      data: {
        htmlLen: html.length,
        questionCount: questions.length,
        types: questions.map((q) => q.type),
        optionCounts: questions.map((q) => q.options.length),
        hasPlanifyQuestao: /planify-questao/i.test(html),
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  if (!questions.length) {
    throw new Error(
      "Nenhuma questão encontrada. Gere uma prova, lista ou quiz antes de exportar ao Google Forms.",
    );
  }

  const createResponse = await fetch("https://forms.googleapis.com/v1/forms", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      info: { title },
    }),
  });

  const createData = (await createResponse.json()) as {
    formId?: string;
    responderUri?: string;
    error?: { message?: string };
  };

  if (!createResponse.ok || !createData.formId) {
    // #region agent log
    fetch("http://127.0.0.1:7453/ingest/bd608440-c83f-44b6-8664-8f8ef1293166", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "335b85" },
      body: JSON.stringify({
        sessionId: "335b85",
        runId: "forms-export",
        hypothesisId: "H3",
        location: "google-forms-export-service.ts:create",
        message: "forms_create_failed",
        data: { status: createResponse.status, apiError: createData.error?.message },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    throw new ExportHttpError(
      createData.error?.message ||
        "Não foi possível criar o formulário no Google Forms.",
      createResponse.status || 502,
    );
  }

  const description =
    input.description?.trim() || "Formulário criado pelo Planify.";
  const requests = [
    {
      updateFormInfo: {
        info: {
          description,
          documentTitle: safeFilename(title),
        },
        updateMask: "description,documentTitle",
      },
    },
    ...questions.map((question, index) => buildFormItemRequest(question, index)),
  ];

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
    // #region agent log
    fetch("http://127.0.0.1:7453/ingest/bd608440-c83f-44b6-8664-8f8ef1293166", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "335b85" },
      body: JSON.stringify({
        sessionId: "335b85",
        runId: "forms-export",
        hypothesisId: "H2",
        location: "google-forms-export-service.ts:batchUpdate",
        message: "forms_batch_failed",
        data: {
          status: batchResponse.status,
          apiError: batchData.error?.message,
          requestCount: requests.length,
          formId: createData.formId,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    throw new ExportHttpError(
      batchData.error?.message ||
        "Formulário criado, mas não foi possível adicionar as questões.",
      batchResponse.status || 502,
    );
  }

  const formId = createData.formId;
  const formUrl = `https://docs.google.com/forms/d/${formId}/edit`;
  const responderUrl =
    createData.responderUri || `https://docs.google.com/forms/d/${formId}/viewform`;

  return {
    formId,
    formUrl,
    responderUrl,
    questionCount: questions.length,
    googleEmail,
  };
}
