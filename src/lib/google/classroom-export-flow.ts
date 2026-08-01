import {
  exportToGoogleDrive,
  fetchClassroomCourses,
  shareToGoogleClassroom,
  type ClassroomCourseOption,
  type ClassroomShareType,
  type GoogleIntegrationStatus,
} from "@/lib/google/google-api-client";
import {
  classroomGoogleScopesMissing,
  isClassroomExportReady,
  normalizeGoogleEmail,
  readClassroomGoogleEmail,
  resolveClassroomOAuthParams,
} from "@/lib/google/classroom-google-account";

export const CLASSROOM_HOME_URL = "https://classroom.google.com";
const CLASSROOM_EXPORT_LOCK_KEY = "planify:classroom-export-in-flight";
const CLASSROOM_EXPORT_LOCK_TTL_MS = 45_000;
const CLASSROOM_COURSES_CACHE_KEY = "planify:classroom-courses-cache:v1";
export const CLASSROOM_COURSES_CACHE_TTL_MS = 5 * 60 * 1000;
export const GOOGLE_CLASSROOM_RATE_LIMIT_MESSAGE =
  "O Google limitou temporariamente as requisições. Aguarde alguns minutos e tente novamente.";

let classroomCoursesInFlight: Promise<ClassroomCourseOption[]> | null = null;

type ClassroomCoursesCacheEntry = {
  savedAt: number;
  googleEmail: string | null;
  courses: ClassroomCourseOption[];
};

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

function readCachedClassroomCourses(
  googleEmail?: string | null,
): ClassroomCourseOption[] | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(CLASSROOM_COURSES_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<ClassroomCoursesCacheEntry>;
    const savedAt = Number(parsed.savedAt);
    const age = Date.now() - savedAt;
    if (!Number.isFinite(age) || age < 0 || age > CLASSROOM_COURSES_CACHE_TTL_MS) {
      window.sessionStorage.removeItem(CLASSROOM_COURSES_CACHE_KEY);
      return null;
    }

    const cachedEmail = normalizeGoogleEmail(parsed.googleEmail);
    const requestedEmail = normalizeGoogleEmail(googleEmail);
    if (requestedEmail && cachedEmail && cachedEmail !== requestedEmail) {
      return null;
    }

    return Array.isArray(parsed.courses)
      ? (parsed.courses as ClassroomCourseOption[])
      : null;
  } catch {
    return null;
  }
}

function writeCachedClassroomCourses(
  courses: ClassroomCourseOption[],
  googleEmail?: string | null,
): void {
  if (typeof window === "undefined") return;

  try {
    const payload: ClassroomCoursesCacheEntry = {
      savedAt: Date.now(),
      googleEmail: normalizeGoogleEmail(googleEmail) || null,
      courses,
    };
    window.sessionStorage.setItem(CLASSROOM_COURSES_CACHE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

export function clearClassroomCoursesCache(): void {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(CLASSROOM_COURSES_CACHE_KEY);
  } catch {
    /* ignore */
  }
}

function normalizeClassroomCoursesError(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error || "");
  if (/resource_exhausted|quota|rate.?limit|too many requests|429|limitou temporariamente/i.test(message)) {
    return new Error(GOOGLE_CLASSROOM_RATE_LIMIT_MESSAGE);
  }
  return error instanceof Error ? error : new Error(message || "Nao foi possivel listar turmas.");
}

export function resolveClassroomOpenUrl(result: {
  openUrl?: string | null;
  classroom?: {
    publications?: Array<{ alternateLink?: string | null }>;
  };
  drive?: { webViewLink?: string | null };
}): string {
  return (
    result.openUrl ||
    result.classroom?.publications?.find((item) => item.alternateLink)?.alternateLink ||
    result.drive?.webViewLink ||
    CLASSROOM_HOME_URL
  );
}

export function buildClassroomCoursesMessage(
  status: GoogleIntegrationStatus | null,
  coursesCount = 0,
): string {
  const googleEmail = status?.googleEmail;

  if (!status?.connected) {
    return "Conecte sua conta Google de professor para listar suas turmas do Classroom.";
  }

  if (classroomGoogleScopesMissing(status)) {
    return "Sua conta Google esta conectada, mas precisa autorizar o Google Classroom para listar turmas e publicar apos sua confirmacao.";
  }

  if (!googleEmail) {
    return "Nao foi possivel confirmar o e-mail da conta Google conectada. Autorize novamente com a conta do professor.";
  }

  if (coursesCount === 0) {
    return "Nenhuma turma ativa encontrada nesta conta. Confira se voce e professor em alguma turma do Google Classroom.";
  }

  return "Conta Google pronta. Escolha a turma, revise os detalhes e confirme a publicacao.";
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
    institutionalEmail: institutionalEmail || savedEmail || status?.googleEmail,
    planifyEmail: status?.planifyEmail,
  });

  const connectedEmail = normalizeGoogleEmail(status?.googleEmail);
  const hintEmail = normalizeGoogleEmail(params.loginHint);
  const sameAccount = Boolean(connectedEmail && hintEmail && connectedEmail === hintEmail);

  return {
    ...params,
    selectAccount: !sameAccount,
  };
}

export { isClassroomExportReady };

export async function loadClassroomCourses(params?: {
  onStatus?: (message: string) => void;
  googleEmail?: string | null;
  forceRefresh?: boolean;
}): Promise<ClassroomCourseOption[]> {
  if (!params?.forceRefresh) {
    const cached = readCachedClassroomCourses(params?.googleEmail);
    if (cached) return cached;
  } else {
    clearClassroomCoursesCache();
  }

  if (classroomCoursesInFlight) return classroomCoursesInFlight;

  params?.onStatus?.("Carregando turmas do Google Classroom...");

  classroomCoursesInFlight = fetchClassroomCourses()
    .then((courses) => {
      writeCachedClassroomCourses(courses, params?.googleEmail);
      return courses;
    })
    .catch((error) => {
      throw normalizeClassroomCoursesError(error);
    })
    .finally(() => {
      classroomCoursesInFlight = null;
    });

  return classroomCoursesInFlight;
}

export async function executeClassroomDriveOnlyExport(params: {
  title: string;
  html: string;
  documentType?: string | null;
  onStatus?: (message: string) => void;
}): Promise<{ openUrl: string }> {
  if (!tryAcquireClassroomExportLock()) {
    throw new Error("Exportacao ja em andamento. Aguarde alguns segundos.");
  }

  try {
    params.onStatus?.("Salvando material no Google Drive...");

    const driveResult = await exportToGoogleDrive({
      title: params.title,
      html: params.html,
      documentType: params.documentType,
    });

    const openUrl =
      driveResult.driveOpenUrl ||
      driveResult.drive.webViewLink ||
      CLASSROOM_HOME_URL;

    return { openUrl };
  } finally {
    releaseClassroomExportLock();
  }
}

export async function executeClassroomMaterialExport(params: {
  title: string;
  html: string;
  courseIds: string[];
  shareType: ClassroomShareType;
  documentType?: string | null;
  description?: string;
  dueDate?: string;
  dueTime?: string;
  maxPoints?: string;
  onStatus?: (message: string) => void;
}): Promise<{
  openUrl: string;
  publicationCount: number;
  errors: Array<{ courseId: string; message: string }>;
  shareType: ClassroomShareType;
}> {
  if (!tryAcquireClassroomExportLock()) {
    throw new Error("Publicacao no Classroom ja esta em andamento. Aguarde alguns segundos.");
  }

  try {
    params.onStatus?.("Gerando arquivo e salvando no Google Drive...");

    const result = await shareToGoogleClassroom({
      title: params.title,
      html: params.html,
      courseIds: params.courseIds,
      shareType: params.shareType,
      description: params.description,
      dueDate: params.dueDate,
      dueTime: params.dueTime,
      maxPoints: params.maxPoints,
      documentType: params.documentType,
    });

    const publicationCount = result.classroom?.publications?.length || 0;
    params.onStatus?.(
      publicationCount > 1
        ? `Material publicado em ${publicationCount} turmas.`
        : "Material publicado no Google Classroom.",
    );

    return {
      openUrl: resolveClassroomOpenUrl(result),
      publicationCount,
      errors: result.classroom?.errors || [],
      shareType: result.classroom?.type || params.shareType,
    };
  } finally {
    releaseClassroomExportLock();
  }
}
