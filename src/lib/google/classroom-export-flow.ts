import {
  exportToGoogleClassroom,
  exportToGoogleDrive,
  fetchClassroomCourses,
  type ClassroomCourseOption,
  type GoogleIntegrationStatus,
} from "@/lib/google/google-api-client";
import {
  isClassroomExportReady,
  isEducarInstitutionalEmail,
  normalizeGoogleEmail,
  readClassroomGoogleEmail,
  resolveClassroomOAuthParams,
} from "@/lib/google/classroom-google-account";

export const CLASSROOM_LAST_COURSE_STORAGE_KEY = "planify-classroom-last-course-id";
export const CLASSROOM_HOME_URL = "https://classroom.google.com";
const CLASSROOM_EXPORT_LOCK_KEY = "planify:classroom-export-in-flight";
const CLASSROOM_EXPORT_LOCK_TTL_MS = 45_000;

function tryAcquireClassroomExportLock(): boolean {
  if (typeof window === "undefined") return true;

  try {
    const raw = window.sessionStorage.getItem(CLASSROOM_EXPORT_LOCK_KEY);
    if (raw) {
      const age = Date.now() - Number(raw);
      if (Number.isFinite(age) && age >= 0 && age < CLASSROOM_EXPORT_LOCK_TTL_MS) {
        return false;
      }
    }
    window.sessionStorage.setItem(CLASSROOM_EXPORT_LOCK_KEY, String(Date.now()));
    return true;
  } catch {
    return true;
  }
}

function releaseClassroomExportLock(): void {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(CLASSROOM_EXPORT_LOCK_KEY);
  } catch {
    /* ignore */
  }
}

export function resolvePreferredClassroomCourseId(
  courses: ClassroomCourseOption[],
): string {
  if (courses.length === 0) return "";

  if (courses.length === 1) {
    return courses[0].id;
  }

  try {
    const saved = sessionStorage.getItem(CLASSROOM_LAST_COURSE_STORAGE_KEY);
    if (saved && courses.some((course) => course.id === saved)) {
      return saved;
    }
  } catch {
    /* ignore */
  }

  return courses[0]?.id || "";
}

export function persistPreferredClassroomCourseId(courseId: string): void {
  if (!courseId) return;

  try {
    sessionStorage.setItem(CLASSROOM_LAST_COURSE_STORAGE_KEY, courseId);
  } catch {
    /* ignore */
  }
}

export function resolveClassroomOpenUrl(result: {
  classroom?: { alternateLink?: string | null };
  drive?: { webViewLink?: string | null };
}): string {
  return (
    result.classroom?.alternateLink ||
    result.drive?.webViewLink ||
    CLASSROOM_HOME_URL
  );
}

export function buildClassroomCoursesMessage(
  status: GoogleIntegrationStatus | null,
  coursesCount: number,
): string {
  if (coursesCount > 0) return "";

  const googleEmail = status?.googleEmail;

  if (!status?.connected) {
    return "Conecte sua conta Google institucional (@educar.rs.gov.br) para enviar ao Classroom.";
  }

  if (googleEmail && !isEducarInstitutionalEmail(googleEmail)) {
    return `A conta Google conectada (${googleEmail}) não é @educar.rs.gov.br. Troque para a conta da escola.`;
  }

  if (googleEmail) {
    return `Nenhuma turma de professor em ${googleEmail}. O material será salvo no Drive — abra o Classroom para anexar à turma ou peça à TI da escola para liberar o acesso.`;
  }

  return "Nenhuma turma de professor encontrada. O material será salvo no Drive — abra o Classroom para anexar à turma.";
}

export function resolveClassroomOAuthStartOptions(
  status: GoogleIntegrationStatus | null,
  institutionalEmail?: string | null,
): {
  selectAccount?: boolean;
  loginHint?: string;
  hostedDomain?: string;
} {
  const savedEmail = readClassroomGoogleEmail();
  const params = resolveClassroomOAuthParams({
    institutionalEmail: institutionalEmail || savedEmail,
    planifyEmail: status?.planifyEmail,
  });

  const connectedEmail = normalizeGoogleEmail(status?.googleEmail);
  const hintEmail = normalizeGoogleEmail(params.loginHint);
  const sameEducarAccount =
    Boolean(connectedEmail && hintEmail && connectedEmail === hintEmail) &&
    isEducarInstitutionalEmail(connectedEmail);

  return {
    ...params,
    selectAccount: !sameEducarAccount,
  };
}

export { isClassroomExportReady };

/** Salva no Drive sem publicar no Classroom (sem turma selecionada). */
export async function executeClassroomDriveOnlyExport(params: {
  title: string;
  html: string;
  documentType?: string | null;
  onStatus?: (message: string) => void;
}): Promise<{ openUrl: string }> {
  if (!tryAcquireClassroomExportLock()) {
    throw new Error("Exportação já em andamento. Aguarde alguns segundos.");
  }

  try {
    params.onStatus?.("Salvando material no Google Drive…");

    const driveResult = await exportToGoogleDrive({
      title: params.title,
      html: params.html,
      documentType: params.documentType,
    });

    const openUrl =
      driveResult.drive.webViewLink ||
      driveResult.driveOpenUrl ||
      CLASSROOM_HOME_URL;

    return { openUrl };
  } finally {
    releaseClassroomExportLock();
  }
}

export async function executeClassroomMaterialExport(params: {
  title: string;
  html: string;
  documentType?: string | null;
  description?: string;
  publishState?: "PUBLISHED" | "DRAFT";
  courseId?: string;
  onStatus?: (message: string) => void;
}): Promise<{ openUrl: string; coursesUsed: number }> {
  if (!tryAcquireClassroomExportLock()) {
    throw new Error("Exportação ao Classroom já em andamento. Aguarde alguns segundos.");
  }

  try {
  let courses: ClassroomCourseOption[] = [];

  // #region agent log
  fetch("http://127.0.0.1:7718/ingest/9ac33552-969d-48be-9089-3a3b10571400", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "5b9381" },
    body: JSON.stringify({
      sessionId: "5b9381",
      hypothesisId: "H-A",
      location: "classroom-export-flow.ts:executeClassroomMaterialExport:entry",
      message: "classroom export started",
      data: {
        hasHtml: Boolean(params.html?.trim()),
        htmlLen: params.html?.length ?? 0,
        courseIdParam: params.courseId || null,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  try {
    courses = await fetchClassroomCourses();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao listar turmas do Classroom.";

    params.onStatus?.(`Turmas indisponíveis (${message}). Salvando no Drive…`);

    const driveResult = await exportToGoogleDrive({
      title: params.title,
      html: params.html,
      documentType: params.documentType,
    });

    return {
      openUrl:
        driveResult.drive.webViewLink ||
        driveResult.driveOpenUrl ||
        CLASSROOM_HOME_URL,
      coursesUsed: 0,
    };
  }

  const explicitCourseId = String(params.courseId || "").trim();

  if (courses.length > 0 && !explicitCourseId) {
    throw new Error("Selecione a turma antes de enviar ao Google Classroom.");
  }

  const courseId = explicitCourseId;

  if (!courseId) {
    const driveResult = await exportToGoogleDrive({
      title: params.title,
      html: params.html,
      documentType: params.documentType,
    });

    params.onStatus?.(
      "Material salvo no Google Drive. Abra o Classroom para anexar à turma.",
    );

    const openUrl =
      driveResult.drive.webViewLink ||
      driveResult.driveOpenUrl ||
      CLASSROOM_HOME_URL;
    // #region agent log
    fetch("http://127.0.0.1:7718/ingest/9ac33552-969d-48be-9089-3a3b10571400", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "5b9381" },
      body: JSON.stringify({
        sessionId: "5b9381",
        hypothesisId: "H-A",
        location: "classroom-export-flow.ts:executeClassroomMaterialExport:noCourses",
        message: "no teacher courses — drive fallback",
        data: {
          coursesCount: courses.length,
          openUrlHost: openUrl ? new URL(openUrl).host : null,
          branch: "drive-fallback",
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    return {
      openUrl,
      coursesUsed: 0,
    };
  }

  const result = await exportToGoogleClassroom({
    title: params.title,
    html: params.html,
    courseId,
    description:
      params.description?.trim() ||
      "Material didático enviado pelo Planify.",
    documentType: params.documentType,
    publishState: params.publishState,
  });

  persistPreferredClassroomCourseId(courseId);

  const openUrl = resolveClassroomOpenUrl(result);
  // #region agent log
  fetch("http://127.0.0.1:7718/ingest/9ac33552-969d-48be-9089-3a3b10571400", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "5b9381" },
    body: JSON.stringify({
      sessionId: "5b9381",
      hypothesisId: "H-A",
      location: "classroom-export-flow.ts:executeClassroomMaterialExport:success",
      message: "classroom export completed",
      data: {
        coursesCount: courses.length,
        courseIdUsed: courseId,
        openUrlHost: openUrl ? new URL(openUrl).host : null,
        branch: "classroom",
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  return {
    openUrl,
    coursesUsed: courses.length,
  };
  } finally {
    releaseClassroomExportLock();
  }
}
