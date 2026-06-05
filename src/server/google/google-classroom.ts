export type ClassroomCourse = {
  id: string;
  name: string;
  section?: string;
  courseState?: string;
};

export type ClassroomPublishResult = {
  courseWorkId: string;
  alternateLink: string | null;
};

export async function listGoogleClassroomCourses(
  accessToken: string,
): Promise<ClassroomCourse[]> {
  const courses: ClassroomCourse[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      pageSize: "100",
      courseStates: "ACTIVE",
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

    if (!response.ok) {
      throw new Error(
        data.error?.message ||
          "Não foi possível listar turmas do Google Classroom. Verifique se a conta tem Classroom ativo.",
      );
    }

    for (const course of data.courses || []) {
      if (!course.id || !course.name) continue;

      courses.push({
        id: course.id,
        name: course.name,
        section: course.section,
        courseState: course.courseState,
      });
    }

    pageToken = data.nextPageToken;
  } while (pageToken);

  return courses.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export async function publishDriveFileToClassroom(params: {
  accessToken: string;
  courseId: string;
  title: string;
  description?: string;
  driveFileId: string;
}): Promise<ClassroomPublishResult> {
  const body = {
    title: params.title,
    description: params.description || "Material enviado pelo Planify.",
    workType: "ASSIGNMENT",
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

  const response = await fetch(
    `https://classroom.googleapis.com/v1/courses/${encodeURIComponent(params.courseId)}/courseWork`,
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
    throw new Error(
      data.error?.message ||
        "Não foi possível publicar o material na turma do Classroom.",
    );
  }

  return {
    courseWorkId: data.id,
    alternateLink: data.alternateLink || null,
  };
}
