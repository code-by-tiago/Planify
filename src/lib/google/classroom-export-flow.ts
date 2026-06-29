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
}): Promise<ClassroomCourseOption[]> {
  params?.onStatus?.("Carregando turmas do Google Classroom...");
  return fetchClassroomCourses();
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
