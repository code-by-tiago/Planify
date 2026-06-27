import { GOOGLE_DOCS_EXPORT_PENDING_KEY } from "@/components/google/GoogleDocsExportButton";
import { GOOGLE_DRIVE_EXPORT_PENDING_KEY } from "@/components/google/GoogleDriveExportButton";
import { GOOGLE_FORMS_EXPORT_PENDING_KEY } from "@/components/google/GoogleFormsExportButton";
import { GOOGLE_SLIDES_EXPORT_PENDING_KEY } from "@/components/google/GoogleSlidesExportButton";
import {
  exportToGoogleDocs,
  exportToGoogleDrive,
  exportToGoogleForms,
  exportToGoogleSlides,
  fetchGoogleStatus,
} from "@/lib/google/google-api-client";
import {
  clearGoogleExportPending,
  consumeGoogleOAuthReturnSignal,
  clearGoogleOAuthResumeActive,
  GOOGLE_EXPORT_PENDING_KEYS,
  hasExportableHtml,
  openGoogleExportUrl,
  readGoogleExportPending,
  releaseGoogleOAuthReturnLock,
  waitForExportableHtml,
  waitForFormsExportReady,
  waitForGoogleConnected,
  type GoogleExportPending,
  type GoogleExportPendingKey,
} from "@/lib/google/google-export-resume";
import { notifyGoogleStatusChanged } from "@/lib/google/google-status-events";

export type ActiveGoogleExportPending = {
  key: GoogleExportPendingKey;
  kind: "product";
  pending: GoogleExportPending;
};

export function findActiveGoogleExportPending(): ActiveGoogleExportPending | null {
  for (const key of GOOGLE_EXPORT_PENDING_KEYS) {
    const pending = readGoogleExportPending(key);
    if (pending?.title) {
      return { key, kind: "product", pending };
    }
  }

  return null;
}

function clearActivePending(active: ActiveGoogleExportPending): void {
  clearGoogleExportPending(active.key);
}

function openExportUrl(url: string, fallbackToSameTab: boolean): boolean {
  const opened = openGoogleExportUrl(url);
  if (!opened && fallbackToSameTab) {
    window.location.assign(url);
    return true;
  }
  return opened;
}

async function executeProductExport(params: {
  key: GoogleExportPendingKey;
  pending: GoogleExportPending;
  getHtml: () => string;
  getPlanningPayload?: () => Record<string, unknown> | null;
  documentType?: string | null;
}): Promise<string> {
  const snapshot = params.pending.html?.trim() || "";
  const html =
    snapshot && hasExportableHtml(snapshot)
      ? snapshot
      : await waitForExportableHtml(params.getHtml);

  if (!hasExportableHtml(html)) {
    throw new Error(
      "O documento ainda nao carregou. Aguarde e tente exportar novamente.",
    );
  }

  const planningPayload =
    params.pending.planningPayload ?? params.getPlanningPayload?.() ?? null;
  const title = params.pending.title;

  if (params.key === GOOGLE_DOCS_EXPORT_PENDING_KEY) {
    const result = await exportToGoogleDocs({
      title,
      html,
      documentType: params.documentType,
      planningPayload,
    });
    return result.documentUrl;
  }

  if (params.key === GOOGLE_DRIVE_EXPORT_PENDING_KEY) {
    const result = await exportToGoogleDrive({
      title,
      html,
      documentType: params.documentType,
      planningPayload,
    });
    return (
      result.drive.webViewLink ||
      result.driveOpenUrl ||
      "https://drive.google.com/drive/my-drive"
    );
  }

  if (params.key === GOOGLE_FORMS_EXPORT_PENDING_KEY) {
    const result = await exportToGoogleForms({
      title,
      html,
      description: "Formulario criado pelo Planify.",
    });
    return result.formUrl;
  }

  if (params.key === GOOGLE_SLIDES_EXPORT_PENDING_KEY) {
    const result = await exportToGoogleSlides({
      title,
      html,
      documentType: params.documentType,
    });
    return result.presentationUrl;
  }

  throw new Error("Exportacao Google pendente nao reconhecida.");
}

function productLabel(key: GoogleExportPendingKey): string {
  if (key === GOOGLE_FORMS_EXPORT_PENDING_KEY) return "Google Forms";
  if (key === GOOGLE_SLIDES_EXPORT_PENDING_KEY) return "Google Slides";
  if (key === GOOGLE_DRIVE_EXPORT_PENDING_KEY) return "Google Drive";
  if (key === GOOGLE_DOCS_EXPORT_PENDING_KEY) return "Google Docs";
  return "Google";
}

export type ResumePendingGoogleExportParams = {
  getHtml: () => string;
  getPlanningPayload?: () => Record<string, unknown> | null;
  documentType?: string | null;
  onStatus?: (message: string) => void;
  onExportError?: (error: unknown) => void;
};

export async function resumePendingGoogleExport(
  params: ResumePendingGoogleExportParams,
): Promise<boolean> {
  const signal = consumeGoogleOAuthReturnSignal();
  if (!signal) return false;

  try {
    if (signal.error) {
      const active = findActiveGoogleExportPending();
      if (active) clearActivePending(active);
      params.onStatus?.(signal.error);
      return true;
    }

    if (!signal.connected) return false;

    const active = findActiveGoogleExportPending();

    if (!active) {
      params.onStatus?.("Conta Google conectada com sucesso.");
      notifyGoogleStatusChanged();
      return true;
    }

    const label = productLabel(active.key);

    params.onStatus?.(`Retomando exportacao para ${label}...`);

    if (active.key === GOOGLE_FORMS_EXPORT_PENDING_KEY) {
      const formsStatus = await waitForFormsExportReady(fetchGoogleStatus);

      if (!formsStatus?.connected || formsStatus.formsScopeGranted !== true) {
        params.onStatus?.(
          "Aguardando permissao do Google Forms. Se nao abrir, clique em Autorizar Google Forms.",
        );
        releaseGoogleOAuthReturnLock();
        return false;
      }
    } else {
      const status = await waitForGoogleConnected(fetchGoogleStatus);

      if (!status?.connected) {
        throw new Error("Conta Google ainda nao conectada. Tente exportar novamente.");
      }
    }

    notifyGoogleStatusChanged();

    const openUrl = await executeProductExport({
      key: active.key,
      pending: active.pending,
      getHtml: params.getHtml,
      getPlanningPayload: params.getPlanningPayload,
      documentType: params.documentType,
    });

    clearActivePending(active);

    const opened = openExportUrl(openUrl, true);
    if (opened) {
      params.onStatus?.(`${label} aberto em nova aba.`);
    } else {
      params.onStatus?.(`${label} criado. Permita pop-ups ou abra: ${openUrl}`);
    }

    clearGoogleOAuthResumeActive();
    return true;
  } catch (error) {
    params.onExportError?.(error);
    const message =
      error instanceof Error ? error.message : "Erro ao retomar exportacao Google.";

    if (/ainda nao carregou|ainda nao conectada/i.test(message)) {
      releaseGoogleOAuthReturnLock();
      return false;
    }

    params.onStatus?.(message);
    clearGoogleOAuthResumeActive();
    return true;
  } finally {
    releaseGoogleOAuthReturnLock();
  }
}
