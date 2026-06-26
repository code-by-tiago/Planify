import { getCurrentAccessToken } from "@/lib/auth/session-client";

async function authHeaders(): Promise<HeadersInit> {
  const token = await getCurrentAccessToken();
  const headers: HeadersInit = { "Content-Type": "application/json" };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

export type GoogleIntegrationStatus = {
  configured: boolean;
  authenticated: boolean;
  connected: boolean;
  googleEmail: string | null;
  planifyEmail: string | null;
  formsScopeGranted?: boolean;
  missingEnv?: string[];
};

export async function fetchGoogleStatus(): Promise<GoogleIntegrationStatus> {
  const token = await getCurrentAccessToken();
  const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

  const response = await fetch("/api/google/status", {
    cache: "no-store",
    credentials: "include",
    headers,
  });

  const data = await response.json().catch(() => null);

  return {
    configured: Boolean(data?.configured),
    authenticated: Boolean(data?.authenticated),
    connected: Boolean(data?.connected),
    googleEmail: data?.googleEmail || null,
    planifyEmail: data?.planifyEmail || null,
    formsScopeGranted: Boolean(data?.formsScopeGranted),
    missingEnv: data?.missingEnv,
  };
}

export function buildGoogleOAuthStartUrl(returnTo = "/editor"): string {
  const params = new URLSearchParams({ returnTo });
  return `/api/google/oauth/start?${params.toString()}`;
}

export async function startGoogleOAuth(
  returnTo = "/editor",
  options?: {
    selectAccount?: boolean;
    loginHint?: string;
    hostedDomain?: string;
  },
): Promise<void> {
  const response = await fetch("/api/google/oauth/start", {
    method: "POST",
    headers: await authHeaders(),
    credentials: "include",
    body: JSON.stringify({
      returnTo,
      selectAccount: options?.selectAccount !== false,
      loginHint: options?.loginHint,
      hostedDomain: options?.hostedDomain,
    }),
  });

  const data = await response.json().catch(() => null);

  if (response.ok && data?.url) {
    window.location.href = data.url;
    return;
  }

  // Fallback: redirecionamento GET com cookie de sessão (proprietário / premium).
  if (response.status === 401) {
    throw new Error(
      data?.error?.message || "Faça login no Planify para conectar o Google.",
    );
  }

  throw new Error(
    data?.error?.message || "Não foi possível iniciar a conexão com o Google.",
  );
}

export async function disconnectGoogle(): Promise<void> {
  const response = await fetch("/api/google/oauth/disconnect", {
    method: "POST",
    headers: await authHeaders(),
    credentials: "include",
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error?.message || "Não foi possível desconectar o Google.");
  }
}

export type ClassroomCourseOption = {
  id: string;
  name: string;
  section?: string;
};

export async function fetchClassroomCourses(): Promise<ClassroomCourseOption[]> {
  const response = await fetch("/api/google/classroom/courses", {
    cache: "no-store",
    credentials: "include",
    headers: await authHeaders(),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error?.message || "Não foi possível carregar turmas.");
  }

  return Array.isArray(data?.courses) ? data.courses : [];
}

export type ClassroomExportResult = {
  drive: { fileId: string; name: string; webViewLink: string | null };
  classroom?: { courseWorkId: string; alternateLink: string | null };
  googleEmail: string | null;
};

export async function exportToGoogleClassroom(params: {
  title: string;
  html: string;
  courseId: string;
  description?: string;
  filename?: string;
  documentType?: string | null;
  publishState?: "PUBLISHED" | "DRAFT";
}): Promise<ClassroomExportResult> {
  const response = await fetch("/api/google/classroom/export", {
    method: "POST",
    headers: await authHeaders(),
    credentials: "include",
    body: JSON.stringify(params),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error?.message || "Não foi possível enviar ao Classroom.");
  }

  return data.data as ClassroomExportResult;
}

export type GoogleDocsExportResult = {
  drive: { fileId: string; name: string; webViewLink: string | null };
  documentUrl: string;
  googleEmail: string | null;
  exportEngine?: "official" | "html";
};

export async function exportToGoogleDocs(params: {
  title: string;
  html: string;
  documentType?: string | null;
  planningPayload?: Record<string, unknown> | null;
}): Promise<GoogleDocsExportResult> {
  const response = await fetch("/api/google/docs/export", {
    method: "POST",
    headers: await authHeaders(),
    credentials: "include",
    body: JSON.stringify(params),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.error?.message || "Não foi possível abrir no Google Docs.",
    );
  }

  return data.data as GoogleDocsExportResult;
}

export type GoogleDriveExportResult = {
  drive: { fileId: string; name: string; webViewLink: string | null };
  driveOpenUrl: string;
  googleEmail: string | null;
  exportEngine?: "official" | "html" | "pdf";
};

export async function exportToGoogleDrive(params: {
  title: string;
  html: string;
  documentType?: string | null;
  planningPayload?: Record<string, unknown> | null;
}): Promise<GoogleDriveExportResult> {
  const response = await fetch("/api/google/drive/export", {
    method: "POST",
    headers: await authHeaders(),
    credentials: "include",
    body: JSON.stringify(params),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.error?.message || "Não foi possível salvar no Google Drive.",
    );
  }

  return data.data as GoogleDriveExportResult;
}

export type GoogleFormsExportResult = {
  formId: string;
  formUrl: string;
  responderUrl: string;
  questionCount: number;
  googleEmail: string | null;
};

export async function exportToGoogleForms(params: {
  title: string;
  html: string;
  description?: string;
}): Promise<GoogleFormsExportResult> {
  const response = await fetch("/api/google/forms/export", {
    method: "POST",
    headers: await authHeaders(),
    credentials: "include",
    body: JSON.stringify(params),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.error?.message || "Não foi possível criar o Google Forms.",
    );
  }

  return data.data as GoogleFormsExportResult;
}
