export type ClassroomCourse = {
  id: string;
  name: string;
  section?: string;
  courseState?: string;
};

function mapClassroomPublishError(apiMessage?: string): string | null {
  const message = String(apiMessage || "");

  if (message.includes("@ClassroomApiDisabled")) {
    return "A rede educar.rs bloqueou o uso da API do Classroom por apps externos. Peça à TI da escola para liberar “apps de terceiros” no Google Classroom.";
  }

  if (message.includes("@AttachmentNotVisible")) {
    return "O Google Classroom não conseguiu acessar o arquivo no Drive. Desconecte o Google, conecte de novo e tente enviar outra vez.";
  }

  if (message.includes("@ProjectPermissionDenied")) {
    return "O Google bloqueou a publicação deste app. Reconecte sua conta Google no Planify e tente novamente.";
  }

  return null;
}

function mapClassroomApiError(
  status: number,
  message?: string,
  context: "list" | "publish" = "list",
): string {
  const normalized = String(message || "").toLowerCase();
  const publishSpecific =
    context === "publish" ? mapClassroomPublishError(message) : null;

  if (publishSpecific) {
    return publishSpecific;
  }

  if (
    status === 403 ||
    normalized.includes("permission") ||
    normalized.includes("insufficient") ||
    normalized.includes("not authorized")
  ) {
    if (context === "publish") {
      const detail = message ? ` (${message})` : "";
      return `Sem permissão para publicar nesta turma${detail}. Se usa conta educar.rs, peça à TI da escola para liberar apps no Classroom e reconecte o Google no Planify.`;
    }

    return "Conta Google sem perfil de professor no Classroom. Use uma conta de professor com turmas ativas.";
  }

  if (status === 404) {
    return "Google Classroom não está disponível para esta conta Google.";
  }

  return (
    message ||
    (context === "publish"
      ? "Não foi possível publicar o material na turma do Classroom."
      : "Não foi possível listar turmas do Google Classroom. Verifique se a conta tem Classroom ativo.")
  );
}

export type ClassroomPublishResult = {
  courseWorkId: string;
  alternateLink: string | null;
};

async function fetchClassroomCoursePage(
  accessToken: string,
  query: Record<string, string>,
  pageToken?: string,
): Promise<{
  courses: ClassroomCourse[];
  nextPageToken?: string;
  error?: { message?: string };
  status: number;
}> {
  const params = new URLSearchParams({
    pageSize: "100",
    ...query,
  });

  if (pageToken) {
    params.set("pageToken", pageToken);
  }

  const response = await fetch(
    `https://classroom.googleapis.com/v1/courses?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  const data = (await response.json()) as {
    courses?: Array<{
      id?: string;
      name?: string;
      section?: string;
      courseState?: string;
    }>;
    nextPageToken?: string;
    error?: { message?: string };
  };

  const courses: ClassroomCourse[] = [];

  for (const course of data.courses || []) {
    if (!course.id || !course.name) continue;

    courses.push({
      id: course.id,
      name: course.name,
      section: course.section,
      courseState: course.courseState,
    });
  }

  return {
    courses,
    nextPageToken: data.nextPageToken,
    error: data.error,
    status: response.status,
  };
}

async function listCoursesWithQuery(
  accessToken: string,
  query: Record<string, string>,
): Promise<ClassroomCourse[]> {
  const courses: ClassroomCourse[] = [];
  let pageToken: string | undefined;
  let lastError: string | undefined;
  let lastStatus = 200;

  do {
    const page = await fetchClassroomCoursePage(accessToken, query, pageToken);

    if (!page.status || page.status >= 400) {
      lastStatus = page.status;
      lastError = page.error?.message;
      break;
    }

    courses.push(...page.courses);
    pageToken = page.nextPageToken;
  } while (pageToken);

  if (courses.length === 0 && lastError) {
    throw new Error(mapClassroomApiError(lastStatus, lastError));
  }

  return courses;
}

export async function listGoogleClassroomCourses(
  accessToken: string,
): Promise<ClassroomCourse[]> {
  const queries = [
    { courseStates: "ACTIVE", teacherId: "me" },
    { courseStates: "ACTIVE,PROVISIONED", teacherId: "me" },
  ];

  const merged = new Map<string, ClassroomCourse>();

  for (const query of queries) {
    const batch = await listCoursesWithQuery(accessToken, query);
    for (const course of batch) {
      merged.set(course.id, course);
    }
    if (merged.size > 0) break;
  }

  return [...merged.values()].sort((a, b) =>
    a.name.localeCompare(b.name, "pt-BR"),
  );
}

export async function publishDriveFileToClassroom(params: {
  accessToken: string;
  courseId: string;
  title: string;
  description?: string;
  driveFileId: string;
  publishState?: "PUBLISHED" | "DRAFT";
}): Promise<ClassroomPublishResult> {
  const body = {
    title: params.title,
    description: params.description || "Material enviado pelo Planify.",
    state: params.publishState === "DRAFT" ? "DRAFT" : "PUBLISHED",
    materials: [
      {
        driveFile: {
          driveFile: { id: params.driveFileId },
          shareMode: "VIEW",
        },
      },
    ],
  };

  const response = await fetch(
    `https://classroom.googleapis.com/v1/courses/${encodeURIComponent(params.courseId)}/courseWorkMaterials`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  const data = (await response.json()) as {
    id?: string;
    alternateLink?: string;
    error?: { message?: string };
  };

  if (!response.ok || !data.id) {
    const apiMessage = data.error?.message || "";
    throw new Error(
      mapClassroomApiError(response.status, apiMessage, "publish"),
    );
  }

  return {
    courseWorkId: data.id,
    alternateLink: data.alternateLink || null,
  };
}
