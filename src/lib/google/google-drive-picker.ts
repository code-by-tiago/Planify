"use client";

import {
  fetchGoogleStatus,
  startGoogleOAuth,
} from "@/lib/google/google-api-client";
import { normalizeGoogleOAuthReturnTo } from "@/lib/google/document-type-detection";

export const GOOGLE_DRIVE_PICKER_PENDING_KEY = "planify:google-drive-picker-pending";
export const GOOGLE_DRIVE_PICKER_RESUME_READY_KEY =
  "planify:google-drive-picker-resume-ready";

export type GoogleDrivePickerPending = {
  returnTo: string;
  maxFiles: number;
  reopenCreatePost?: boolean;
  ts: number;
};

export function saveGoogleDrivePickerPending(
  payload: Omit<GoogleDrivePickerPending, "ts">,
): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    GOOGLE_DRIVE_PICKER_PENDING_KEY,
    JSON.stringify({ ...payload, ts: Date.now() }),
  );
  window.sessionStorage.removeItem(GOOGLE_DRIVE_PICKER_RESUME_READY_KEY);
}

export function readGoogleDrivePickerPending(): GoogleDrivePickerPending | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(GOOGLE_DRIVE_PICKER_PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GoogleDrivePickerPending;
    if (!parsed?.returnTo || Date.now() - Number(parsed.ts || 0) > 30 * 60_000) {
      clearGoogleDrivePickerPending();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearGoogleDrivePickerPending(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(GOOGLE_DRIVE_PICKER_PENDING_KEY);
}

/** Marca que o OAuth concluiu e o Picker deve reabrir (uma vez). */
export function markGoogleDrivePickerResumeReady(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(GOOGLE_DRIVE_PICKER_RESUME_READY_KEY, String(Date.now()));
}

export function consumeGoogleDrivePickerResumeReady(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.sessionStorage.getItem(GOOGLE_DRIVE_PICKER_RESUME_READY_KEY);
    if (!raw) return false;
    window.sessionStorage.removeItem(GOOGLE_DRIVE_PICKER_RESUME_READY_KEY);
    const age = Date.now() - Number(raw);
    return Number.isFinite(age) && age < 2 * 60_000;
  } catch {
    return false;
  }
}

type PickerTokenResponse = {
  success?: boolean;
  data?: {
    accessToken: string;
    clientId: string;
    apiKey: string;
    appId: string | null;
  };
  error?: { message?: string };
};

type GooglePickerDoc = {
  id: string;
  name: string;
  mimeType: string;
};

declare global {
  interface Window {
    google?: {
      picker?: {
        PickerBuilder: new () => GooglePickerBuilder;
        Action: { PICKED: string; CANCEL: string };
        Feature: { MULTISELECT_ENABLED: string; NAV_HIDDEN: string };
        ViewId: { DOCS: string };
        DocsView: new (viewId?: string) => GoogleDocsView;
      };
    };
    gapi?: {
      load: (name: string, callback: () => void) => void;
    };
  }
}

type GoogleDocsView = {
  setMimeTypes: (mimes: string) => GoogleDocsView;
  setIncludeFolders: (include: boolean) => GoogleDocsView;
};

type GooglePickerBuilder = {
  addView: (view: GoogleDocsView) => GooglePickerBuilder;
  enableFeature: (feature: string) => GooglePickerBuilder;
  setOAuthToken: (token: string) => GooglePickerBuilder;
  setDeveloperKey: (key: string) => GooglePickerBuilder;
  setAppId: (appId: string) => GooglePickerBuilder;
  setCallback: (
    cb: (data: { action: string; docs?: GooglePickerDoc[] }) => void,
  ) => GooglePickerBuilder;
  setTitle: (title: string) => GooglePickerBuilder;
  build: () => { setVisible: (visible: boolean) => void };
};

const PICKER_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.google-apps.document",
  "application/vnd.google-apps.presentation",
  "image/png",
  "image/jpeg",
  "image/webp",
].join(",");

let pickerScriptPromise: Promise<void> | null = null;

function loadPickerScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Picker só funciona no navegador."));
  }
  if (window.google?.picker) return Promise.resolve();
  if (pickerScriptPromise) return pickerScriptPromise;

  pickerScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-planify-google-api="1"]',
    );
    const onReady = () => {
      if (!window.gapi?.load) {
        reject(new Error("Google API não carregou."));
        return;
      }
      window.gapi.load("picker", () => resolve());
    };

    if (existing) {
      if (window.gapi) onReady();
      else existing.addEventListener("load", onReady);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.async = true;
    script.defer = true;
    script.dataset.planifyGoogleApi = "1";
    script.onload = onReady;
    script.onerror = () => reject(new Error("Falha ao carregar Google API."));
    document.head.appendChild(script);
  });

  return pickerScriptPromise;
}

async function fetchPickerToken(): Promise<NonNullable<PickerTokenResponse["data"]>> {
  const response = await fetch("/api/google/picker/token", {
    credentials: "include",
    cache: "no-store",
  });
  const data = (await response.json().catch(() => null)) as PickerTokenResponse | null;
  if (!response.ok || !data?.success || !data.data?.accessToken) {
    throw new Error(
      data?.error?.message || "Conecte o Google para anexar do Drive.",
    );
  }
  return data.data;
}

function openNativePicker(params: {
  accessToken: string;
  clientId: string;
  apiKey: string;
  appId: string | null;
}): Promise<GooglePickerDoc[]> {
  return new Promise((resolve, reject) => {
    const pickerApi = window.google?.picker;
    if (!pickerApi) {
      reject(new Error("Google Picker indisponível."));
      return;
    }

    const view = new pickerApi.DocsView(pickerApi.ViewId.DOCS)
      .setIncludeFolders(true)
      .setMimeTypes(PICKER_MIME_TYPES);

    const builder = new pickerApi.PickerBuilder()
      .addView(view)
      .enableFeature(pickerApi.Feature.MULTISELECT_ENABLED)
      .setOAuthToken(params.accessToken)
      .setDeveloperKey(params.apiKey)
      .setTitle("Anexar do Google Drive")
      .setCallback((data) => {
        if (data.action === pickerApi.Action.CANCEL) {
          resolve([]);
          return;
        }
        if (data.action === pickerApi.Action.PICKED) {
          resolve(Array.isArray(data.docs) ? data.docs : []);
        }
      });

    if (params.appId) {
      builder.setAppId(params.appId);
    }

    builder.build().setVisible(true);
  });
}

async function importDriveFileAsBrowserFile(doc: GooglePickerDoc): Promise<File> {
  const response = await fetch("/api/google/drive/import", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileId: doc.id,
      filename: doc.name,
      mimeType: doc.mimeType,
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(
      data?.error?.message || `Não foi possível importar "${doc.name}".`,
    );
  }

  const blob = await response.blob();
  const headerName = response.headers.get("X-Planify-Filename");
  const headerMime = response.headers.get("X-Planify-Mime");
  const filename = headerName
    ? decodeURIComponent(headerName)
    : doc.name || "arquivo-drive";
  const mimeType = headerMime || blob.type || doc.mimeType || "application/octet-stream";

  return new File([blob], filename, { type: mimeType });
}

/**
 * Abre o Google Picker e devolve Files prontos para o composer.
 */
export async function pickFilesFromGoogleDrive(options?: {
  returnTo?: string;
  maxFiles?: number;
  reopenCreatePost?: boolean;
}): Promise<File[]> {
  const returnTo = normalizeGoogleOAuthReturnTo(
    options?.returnTo ||
      (typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}`
        : "/comunidade"),
  );
  const maxFiles = Math.max(1, options?.maxFiles ?? 5);

  const status = await fetchGoogleStatus();
  if (!status.connected) {
    saveGoogleDrivePickerPending({
      returnTo,
      maxFiles,
      reopenCreatePost: options?.reopenCreatePost !== false,
    });
    await startGoogleOAuth(returnTo);
    return [];
  }

  await loadPickerScript();
  const token = await fetchPickerToken();
  const docs = await openNativePicker({
    accessToken: token.accessToken,
    clientId: token.clientId,
    apiKey: token.apiKey,
    appId: token.appId,
  });

  if (!docs.length) return [];

  const selected = docs.slice(0, maxFiles);
  const files: File[] = [];

  for (const doc of selected) {
    files.push(await importDriveFileAsBrowserFile(doc));
  }

  return files;
}
