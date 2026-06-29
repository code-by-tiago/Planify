const CLIENT_DEDUP_KEY = "planify:classroom-share-last";
const CLIENT_DEDUP_TTL_MS = 3 * 60 * 1000;

export type ClassroomClientExportFingerprint = {
  title: string;
  htmlHash: string;
  courseId: string;
  shareType: string;
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
    if (!parsed?.title || !parsed?.ts) return null;
    if (Date.now() - parsed.ts > CLIENT_DEDUP_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function assertClassroomClientExportAllowed(params: {
  title: string;
  html: string;
  courseId?: string;
  shareType?: string;
}): void {
  const last = readLastClassroomClientExport();
  if (!last) return;

  const samePayload =
    last.title === params.title.trim() &&
    last.htmlHash === hashHtmlSnippet(params.html) &&
    last.courseId === String(params.courseId || "").trim() &&
    last.shareType === String(params.shareType || "material").trim();

  if (samePayload) {
    throw new Error(
      "Este material ja foi publicado para esta turma nesta sessao. Aguarde alguns minutos ou altere o conteudo antes de publicar novamente.",
    );
  }
}

export function recordClassroomClientExport(params: {
  title: string;
  html: string;
  courseId?: string;
  shareType?: string;
}): void {
  if (typeof window === "undefined") return;

  try {
    const payload: ClassroomClientExportFingerprint = {
      title: params.title.trim(),
      htmlHash: hashHtmlSnippet(params.html),
      courseId: String(params.courseId || "").trim(),
      shareType: String(params.shareType || "material").trim(),
      ts: Date.now(),
    };
    window.sessionStorage.setItem(CLIENT_DEDUP_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

export function buildClassroomExportReviewSummary(params: {
  title: string;
}): {
  title: string;
  modeLabel: string;
  modeDescription: string;
} {
  return {
    title: params.title,
    modeLabel: "Publicacao confirmada",
    modeDescription:
      "O professor escolhe a turma, revisa os detalhes e confirma antes de publicar no Google Classroom.",
  };
}

export function buildClassroomExportSuccessMessage(): string {
  return "Material publicado no Google Classroom.";
}
