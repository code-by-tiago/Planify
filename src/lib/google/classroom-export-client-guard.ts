const CLIENT_DEDUP_KEY = "planify:classroom-export-last";
const CLIENT_DEDUP_TTL_MS = 3 * 60 * 1000;

export type ClassroomClientExportFingerprint = {
  courseId: string;
  title: string;
  htmlHash: string;
  ts: number;
};

function hashHtmlSnippet(html: string): string {
  let hash = 0;
  const sample = String(html || "").slice(0, 4000);

  for (let i = 0; i < sample.length; i += 1) {
    hash = (hash * 31 + sample.charCodeAt(i)) | 0;
  }

  return String(hash);
}

export function readLastClassroomClientExport(): ClassroomClientExportFingerprint | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(CLIENT_DEDUP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ClassroomClientExportFingerprint;
    if (!parsed?.courseId || !parsed?.ts) return null;
    if (Date.now() - parsed.ts > CLIENT_DEDUP_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function assertClassroomClientExportAllowed(params: {
  courseId: string;
  title: string;
  html: string;
}): void {
  const last = readLastClassroomClientExport();
  if (!last) return;

  const samePayload =
    last.courseId === params.courseId.trim() &&
    last.title === params.title.trim() &&
    last.htmlHash === hashHtmlSnippet(params.html);

  if (samePayload) {
    throw new Error(
      "Este material já foi enviado para esta turma nesta sessão. Aguarde alguns minutos ou altere o conteúdo antes de reenviar.",
    );
  }
}

export function recordClassroomClientExport(params: {
  courseId: string;
  title: string;
  html: string;
}): void {
  if (typeof window === "undefined") return;

  try {
    const payload: ClassroomClientExportFingerprint = {
      courseId: params.courseId.trim(),
      title: params.title.trim(),
      htmlHash: hashHtmlSnippet(params.html),
      ts: Date.now(),
    };
    window.sessionStorage.setItem(CLIENT_DEDUP_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

export function resolveSelectedCourseLabel(
  courses: Array<{ id: string; name: string; section?: string }>,
  courseId: string,
): string {
  const match = courses.find((course) => course.id === courseId);
  if (!match) return "turma selecionada";
  return match.section ? `${match.name} — ${match.section}` : match.name;
}

export function buildClassroomExportReviewSummary(params: {
  title: string;
  courseLabel: string;
  asDraft: boolean;
}): {
  title: string;
  courseLabel: string;
  modeLabel: string;
  modeDescription: string;
} {
  return {
    title: params.title,
    courseLabel: params.courseLabel,
    modeLabel: params.asDraft ? "Rascunho" : "Publicado",
    modeDescription: params.asDraft
      ? "Só você vê no Classroom até publicar manualmente na turma."
      : "Visível para os alunos imediatamente após o envio.",
  };
}

export function buildClassroomExportSuccessMessage(params: {
  asDraft: boolean;
  courseLabel: string;
}): string {
  if (params.asDraft) {
    return `Rascunho salvo em "${params.courseLabel}". Publique no Classroom quando estiver pronto.`;
  }

  return `Material publicado em "${params.courseLabel}".`;
}
