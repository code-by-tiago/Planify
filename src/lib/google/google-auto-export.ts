import { GOOGLE_DOCS_EXPORT_PENDING_KEY } from "@/components/google/GoogleDocsExportButton";
import { GOOGLE_FORMS_EXPORT_PENDING_KEY } from "@/components/google/GoogleFormsExportButton";
import type { PlanifyToolId } from "@/lib/pro/planifyTools";
import {
  exportToGoogleDocs,
  exportToGoogleForms,
  exportToGoogleSlides,
  fetchGoogleStatus,
  startGoogleOAuth,
} from "@/lib/google/google-api-client";
import { clearOtherGoogleExportPending } from "@/lib/google/google-export-resume";
import { saveGoogleSlidesExportPending } from "@/lib/google/google-status-events";

export const AUTO_GOOGLE_EXPORT_INTENT_KEY = "planify:auto-google-export";

export type GoogleAutoExportProduct = "slides" | "docs" | "forms";

export type AutoGoogleExportIntent = {
  product: GoogleAutoExportProduct;
  title: string;
  returnTo: string;
  slideTheme?: string;
  ts: number;
};

const INTENT_TTL_MS = 30 * 60 * 1000;

export function resolveGoogleProductForTool(
  toolId: PlanifyToolId,
): GoogleAutoExportProduct {
  if (toolId === "slides") return "slides";
  if (toolId === "prova" || toolId === "lista") {
    return "forms";
  }
  return "docs";
}

export function saveAutoGoogleExportIntent(
  payload: Omit<AutoGoogleExportIntent, "ts">,
): void {
  if (typeof window === "undefined") return;

  window.sessionStorage.setItem(
    AUTO_GOOGLE_EXPORT_INTENT_KEY,
    JSON.stringify({ ...payload, ts: Date.now() } satisfies AutoGoogleExportIntent),
  );
}

export function readAutoGoogleExportIntent(): AutoGoogleExportIntent | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(AUTO_GOOGLE_EXPORT_INTENT_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as AutoGoogleExportIntent;
    if (!parsed?.product || !parsed.title || !parsed.returnTo) return null;

    if (Date.now() - (parsed.ts || 0) > INTENT_TTL_MS) {
      window.sessionStorage.removeItem(AUTO_GOOGLE_EXPORT_INTENT_KEY);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function clearAutoGoogleExportIntent(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(AUTO_GOOGLE_EXPORT_INTENT_KEY);
}

function saveProductExportPending(params: {
  product: GoogleAutoExportProduct;
  title: string;
  returnTo: string;
  slideTheme?: string;
}): void {
  if (typeof window === "undefined") return;

  if (params.product === "slides") {
    saveGoogleSlidesExportPending({
      title: params.title,
      theme: params.slideTheme,
      returnTo: params.returnTo,
    });
    return;
  }

  const pending = { title: params.title, returnTo: params.returnTo, ts: Date.now() };
  const key =
    params.product === "forms"
      ? GOOGLE_FORMS_EXPORT_PENDING_KEY
      : GOOGLE_DOCS_EXPORT_PENDING_KEY;

  clearOtherGoogleExportPending(key);
  window.sessionStorage.setItem(key, JSON.stringify(pending));
}

export type AutoGoogleExportResult =
  | "exported"
  | "oauth_started"
  | "login_required"
  | "skipped"
  | "failed";

export async function executeAutoGoogleExport(params: {
  product: GoogleAutoExportProduct;
  title: string;
  getHtml: () => string;
  returnTo: string;
  slideTheme?: string;
}): Promise<AutoGoogleExportResult> {
  const status = await fetchGoogleStatus();

  if (!status.configured) {
    return "skipped";
  }

  if (!status.authenticated) {
    saveProductExportPending(params);
    window.location.href = `/login?redirect=${encodeURIComponent(params.returnTo)}`;
    return "login_required";
  }

  if (!status.connected) {
    saveProductExportPending(params);
    await startGoogleOAuth(params.returnTo);
    return "oauth_started";
  }

  const html = params.getHtml().trim();
  if (!html) {
    return "failed";
  }

  try {
    let openUrl = "";

    if (params.product === "slides") {
      const result = await exportToGoogleSlides({
        title: params.title,
        html,
        theme: params.slideTheme,
      });
      openUrl = result.presentationUrl;
    } else if (params.product === "forms") {
      const result = await exportToGoogleForms({
        title: params.title,
        html,
        description: "Formulário criado pelo Planify.",
      });
      openUrl = result.formUrl;
    } else {
      const result = await exportToGoogleDocs({
        title: params.title,
        html,
      });
      openUrl = result.documentUrl;
    }

    window.open(openUrl, "_blank", "noopener,noreferrer");
    return "exported";
  } catch {
    return "failed";
  }
}
