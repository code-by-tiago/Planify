import { getCurrentAccessToken } from "@/lib/auth/session-client";

const GOOGLE_STATUS_DEDUPE_MS = 5000;
const CLASSROOM_COURSES_DEDUPE_MS = 30000;

type CachedPromise<T> = {
  expiresAt: number;
  promise: Promise<T>;
};

function cacheKey(token: string | null) {
  return token ? `bearer:${token}` : "cookie";
}

function getFreshCachedPromise<T>(
  cache: Map<string, CachedPromise<T>>,
  key: string,
) {
  const cached = cache.get(key);
  return cached && cached.expiresAt > Date.now() ? cached.promise : null;
}

function setCachedPromise<T>(
  cache: Map<string, CachedPromise<T>>,
  key: string,
  promise: Promise<T>,
  ttlMs: number,
) {
  cache.set(key, {
    expiresAt: Date.now() + ttlMs,
    promise,
  });

  promise.catch(() => {
    cache.delete(key);
  });
}

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
  classroomScopeGranted?: boolean;
  missingClassroomScopes?: string[];
  missingEnv?: string[];
};

const googleStatusCache = new Map<string, CachedPromise<GoogleIntegrationStatus>>();

export async function fetchGoogleStatus(): Promise<GoogleIntegrationStatus> {
  const token = await getCurrentAccessToken();
  const key = cacheKey(token);
  const cached = getFreshCachedPromise(googleStatusCache, key);

  if (cached) {
    return cached;
  }

  const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

  const promise = fetch("/api/google/status", {
    cache: "no-store",
    credentials: "include",
    headers,
  }).then(async (response) => {
    const data = await response.json().catch(() => null);

    return {
      configured: Boolean(data?.configured),
      authenticated: Boolean(data?.authenticated),
      connected: Boolean(data?.connected),
      googleEmail: data?.googleEmail || null,
      planifyEmail: data?.planifyEmail || null,
      formsScopeGranted: Boolean(data?.formsScopeGranted),
      classroomScopeGranted: Boolean(data?.classroomScopeGranted),
      missingClassroomScopes: Array.isArray(data?.missingClassroomScopes)
        ? data.missingClassroomScopes
        : undefined,
      missingEnv: data?.missingEnv,
    };
  });

  setCachedPromise(googleStatusCache, key, promise, GOOGLE_STATUS_DEDUPE_MS);

  return promise;
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

export async function startGoogleClassroomOAuth(
  returnTo = "/editor",
  options?: {
    selectAccount?: boolean;
    loginHint?: string;
    hostedDomain?: string;
  },
): Promise<void> {
  const response = await fetch("/api/google/classroom/auth", {
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

  if (response.status === 401) {
    throw new Error(
      data?.error?.message || "Faca login no Planify para conectar o Google.",
    );
  }

  throw new Error(
    data?.error?.message || "Nao foi possivel iniciar a conexao com o Google Classroom.",
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
  googleStatusCache.clear();
  classroomCoursesCache.clear();
}

export type ClassroomShareType = "material" | "assignment";

export type ClassroomCourseOption = {
  id: string;
  name: string;
  section?: string;
  descriptionHeading?: string;
  courseState?: string;
  alternateLink?: string | null;
};

const classroomCoursesCache = new Map<
  string,
  CachedPromise<ClassroomCourseOption[]>
>();

export type ClassroomExportResult = {
  drive: { fileId: string; name: string; webViewLink: string | null };
  classroom: {
    publications: Array<{
      id: string;
      alternateLink: string | null;
      type: ClassroomShareType;
      courseId: string;
    }>;
    errors: Array<{ courseId: string; message: string }>;
    type: ClassroomShareType;
  };
  openUrl: string;
  googleEmail: string | null;
  exportFormat?: "pdf" | "docx";
};

export async function fetchClassroomCourses(): Promise<ClassroomCourseOption[]> {
  const token = await getCurrentAccessToken();
  const key = cacheKey(token);
  const cached = getFreshCachedPromise(classroomCoursesCache, key);

  if (cached) {
    return cached;
  }

  const headers: HeadersInit = { "Content-Type": "application/json" };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const promise = fetch("/api/google/classroom/courses", {
    method: "GET",
    headers,
    credentials: "include",
    cache: "no-store",
  }).then(async (response) => {
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.error?.message || "Nao foi possivel listar turmas.");
    }

    return Array.isArray(data?.courses) ? (data.courses as ClassroomCourseOption[]) : [];
  });

  setCachedPromise(
    classroomCoursesCache,
    key,
    promise,
    CLASSROOM_COURSES_DEDUPE_MS,
  );

  return promise;
}

export async function shareToGoogleClassroom(params: {
  title: string;
  html: string;
  courseId?: string;
  courseIds?: string[];
  shareType: ClassroomShareType;
  description?: string;
  dueDate?: string;
  dueTime?: string;
  maxPoints?: string;
  filename?: string;
  documentType?: string | null;
}): Promise<ClassroomExportResult> {
  const response = await fetch("/api/google/classroom/share", {
    method: "POST",
    headers: await authHeaders(),
    credentials: "include",
    body: JSON.stringify(params),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error?.message || "Nao foi possivel publicar no Classroom.");
  }

  return data.data as ClassroomExportResult;
}

export async function exportToGoogleClassroom(params: {
  title: string;
  html: string;
  courseId?: string;
  courseIds?: string[];
  shareType: ClassroomShareType;
  description?: string;
  dueDate?: string;
  dueTime?: string;
  maxPoints?: string;
  filename?: string;
  documentType?: string | null;
}): Promise<ClassroomExportResult> {
  return shareToGoogleClassroom(params);
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
