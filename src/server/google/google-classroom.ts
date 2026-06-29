const CLASSROOM_API_BASE = "https://classroom.googleapis.com/v1";

export type ClassroomCourse = {
  id: string;
  name: string;
  section?: string;
  descriptionHeading?: string;
  courseState?: string;
  alternateLink?: string | null;
};

export type ClassroomShareType = "material" | "assignment";

export type ClassroomPublishResult = {
  id: string;
  alternateLink: string | null;
  type: ClassroomShareType;
  courseId: string;
};

export type ClassroomAssignmentOptions = {
  dueDate?: {
    year: number;
    month: number;
    day: number;
  };
  dueTime?: {
    hours?: number;
    minutes?: number;
  };
  maxPoints?: number;
};

type GoogleClassroomErrorBody = {
  error?: {
    code?: number;
    message?: string;
    status?: string;
    details?: unknown[];
  };
};

type GoogleClassroomCourseListResponse = {
  courses?: ClassroomCourse[];
  nextPageToken?: string;
};

type GoogleClassroomCreateResponse = {
  id?: string;
  alternateLink?: string;
};

function parseGoogleErrorMessage(data: GoogleClassroomErrorBody | null): string {
  return String(data?.error?.message || "").trim();
}

async function parseGoogleJson<T>(response: Response): Promise<T | null> {
  return (await response.json().catch(() => null)) as T | null;
}

function mapClassroomApiError(
  response: Response,
  data: GoogleClassroomErrorBody | null,
  action: "listar turmas" | "publicar material",
): Error {
  const message = parseGoogleErrorMessage(data);
  const status = data?.error?.status || response.statusText;
  const detail = message ? ` Detalhe Google: ${message}` : "";

  if (response.status === 401 || /invalid credentials|unauthorized/i.test(message)) {
    return new Error(
      `Sua sessao Google expirou ou perdeu permissao para ${action}. Reconecte o Google Classroom.${detail}`,
    );
  }

  if (
    response.status === 403 ||
    /insufficient|permission|not authorized|forbidden|access/i.test(message)
  ) {
    return new Error(
      `A conta Google conectada nao tem permissao suficiente para ${action} no Classroom. Use a conta do professor da turma e autorize novamente.${detail}`,
    );
  }

  if (response.status === 404 || /not found|classroom api/i.test(message)) {
    return new Error(
      `Nao foi possivel acessar o Google Classroom desta conta. Confira se o Classroom esta habilitado para o usuario e se a API esta ativa no Google Cloud.${detail}`,
    );
  }

  return new Error(
    `Falha ao ${action} no Google Classroom (${response.status} ${status}).${detail}`,
  );
}

export async function listGoogleClassroomCourses(
  accessToken: string,
): Promise<ClassroomCourse[]> {
  const courses: ClassroomCourse[] = [];
  let pageToken: string | null = null;

  do {
    const params = new URLSearchParams({
      pageSize: "100",
      teacherId: "me",
      courseStates: "ACTIVE",
    });

    if (pageToken) {
      params.set("pageToken", pageToken);
    }

    const response = await fetch(`${CLASSROOM_API_BASE}/courses?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });
    const data = await parseGoogleJson<GoogleClassroomCourseListResponse & GoogleClassroomErrorBody>(
      response,
    );

    if (!response.ok) {
      throw mapClassroomApiError(response, data, "listar turmas");
    }

    for (const course of data?.courses || []) {
      if (!course?.id || !course.name) continue;
      courses.push({
        id: String(course.id),
        name: String(course.name),
        section: course.section ? String(course.section) : undefined,
        descriptionHeading: course.descriptionHeading
          ? String(course.descriptionHeading)
          : undefined,
        courseState: course.courseState ? String(course.courseState) : undefined,
        alternateLink: course.alternateLink ? String(course.alternateLink) : null,
      });
    }

    pageToken = data?.nextPageToken ? String(data.nextPageToken) : null;
  } while (pageToken);

  return courses;
}

export async function publishDriveFileToClassroom(params: {
  accessToken: string;
  courseId: string;
  title: string;
  description?: string;
  driveFileId: string;
  shareType?: ClassroomShareType;
  assignment?: ClassroomAssignmentOptions;
}): Promise<ClassroomPublishResult> {
  const shareType: ClassroomShareType =
    params.shareType === "assignment" ? "assignment" : "material";
  const courseId = encodeURIComponent(params.courseId);
  const endpoint =
    shareType === "assignment"
      ? `${CLASSROOM_API_BASE}/courses/${courseId}/courseWork`
      : `${CLASSROOM_API_BASE}/courses/${courseId}/courseWorkMaterials`;
  const body =
    shareType === "assignment"
      ? {
          title: params.title,
          description: params.description || undefined,
          workType: "ASSIGNMENT",
          state: "PUBLISHED",
          dueDate: params.assignment?.dueDate,
          dueTime: params.assignment?.dueTime,
          maxPoints: params.assignment?.maxPoints,
          materials: [
            {
              driveFile: {
                driveFile: { id: params.driveFileId },
                shareMode: "VIEW",
              },
            },
          ],
        }
      : {
          title: params.title,
          description: params.description || undefined,
          state: "PUBLISHED",
          materials: [
            {
              driveFile: {
                driveFile: { id: params.driveFileId },
                shareMode: "VIEW",
              },
            },
          ],
        };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await parseGoogleJson<GoogleClassroomCreateResponse & GoogleClassroomErrorBody>(
    response,
  );

  if (!response.ok) {
    throw mapClassroomApiError(response, data, "publicar material");
  }

  if (!data?.id) {
    throw new Error(
      "O Google Classroom aceitou a requisicao, mas nao retornou o identificador da publicacao.",
    );
  }

  return {
    id: String(data.id),
    alternateLink: data.alternateLink ? String(data.alternateLink) : null,
    type: shareType,
    courseId: params.courseId,
  };
}
