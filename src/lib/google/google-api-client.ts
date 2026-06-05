import { getCurrentAccessToken } from "@/lib/auth/session-client";

async function authHeaders(): Promise<HeadersInit> {
  const token = await getCurrentAccessToken();

  if (!token) {
    throw new Error("Faça login no Planify para usar o Google Classroom.");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export type GoogleIntegrationStatus = {
  configured: boolean;
  authenticated: boolean;
  connected: boolean;
  googleEmail: string | null;
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
    missingEnv: data?.missingEnv,
  };
}

export async function startGoogleOAuth(returnTo = "/editor"): Promise<void> {
  const headers = await authHeaders();
  const response = await fetch("/api/google/oauth/start", {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify({ returnTo }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.url) {
    throw new Error(data?.error?.message || "Não foi possível iniciar conexão Google.");
  }

  window.location.href = data.url;
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

export type GoogleSlidesExportResult = {
  drive: { fileId: string; name: string; webViewLink: string | null };
  presentationUrl: string;
  googleEmail: string | null;
  slideCount: number;
};

export async function exportToGoogleSlides(params: {
  title: string;
  html: string;
  slides?: Array<{
    title: string;
    bullets: string[];
    speakerNotes: string;
    layout?: string;
    subtitle?: string;
    imagePrompt?: string;
    imageUrl?: string;
    imageAlt?: string;
    sequenceStep?: number;
    sequenceLabel?: string;
  }>;
}): Promise<GoogleSlidesExportResult> {
  const response = await fetch("/api/google/slides/export", {
    method: "POST",
    headers: await authHeaders(),
    credentials: "include",
    body: JSON.stringify(params),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.error?.message || "Não foi possível abrir no Google Apresentações.",
    );
  }

  return data.data as GoogleSlidesExportResult;
}
