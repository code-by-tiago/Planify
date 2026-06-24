import { GOOGLE_DOCS_EXPORT_PENDING_KEY } from "@/components/google/GoogleDocsExportButton";
import { GOOGLE_FORMS_EXPORT_PENDING_KEY } from "@/components/google/GoogleFormsExportButton";
import type { PlanifyToolId } from "@/lib/pro/planifyTools";
import { materialExportAllows } from "@/lib/export/material-export-policy";
import {
  exportToGoogleDocs,
  exportToGoogleForms,
  fetchGoogleStatus,
  startGoogleOAuth,
} from "@/lib/google/google-api-client";
import { saveGoogleExportPending } from "@/lib/google/google-export-resume";

export const AUTO_GOOGLE_EXPORT_INTENT_KEY = "planify:auto-google-export";

export type GoogleAutoExportProduct = "docs" | "forms";

export type AutoGoogleExportIntent = {
  product: GoogleAutoExportProduct;
  title: string;
  returnTo: string;
  ts: number;
};

const INTENT_TTL_MS = 30 * 60 * 1000;

export function resolveGoogleProductForTool(
  toolId: PlanifyToolId,
): GoogleAutoExportProduct | null {
  if (toolId === "prova" || toolId === "lista") {
    return "forms";
  }
  if (
    materialExportAllows("google-docs", `material:${toolId}`) &&
    !materialExportAllows("google-forms", `material:${toolId}`)
  ) {
    return "docs";
  }
  return null;
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
  html: string;
}): void {
  if (typeof window === "undefined") return;

  const key =
    params.product === "forms"
      ? GOOGLE_FORMS_EXPORT_PENDING_KEY
      : GOOGLE_DOCS_EXPORT_PENDING_KEY;

  saveGoogleExportPending(key, {
    title: params.title,
    returnTo: params.returnTo,
    html: params.html,
  });
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
}): Promise<AutoGoogleExportResult> {
  const status = await fetchGoogleStatus();

  if (!status.configured) {
    return "skipped";
  }

  const html = params.getHtml().trim();
  if (!html) {
    return "failed";
  }

  if (!status.authenticated) {
    saveProductExportPending({ ...params, html });
    window.location.href = `/login?redirect=${encodeURIComponent(params.returnTo)}`;
    return "login_required";
  }

  const needsOAuth =
    !status.connected ||
    (params.product === "forms" && status.formsScopeGranted !== true);

  if (needsOAuth) {
    saveProductExportPending({ ...params, html });
    await startGoogleOAuth(params.returnTo, { selectAccount: true });
    return "oauth_started";
  }

  try {
    let openUrl = "";

    if (params.product === "forms") {
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
