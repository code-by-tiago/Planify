import { NextRequest, NextResponse } from "next/server";
import { resolvePlanifyUserFromRequest } from "@/server/google/google-auth";
import { GOOGLE_CLASSROOM_COURSES_SCOPES } from "@/server/google/google-config";
import { listGoogleClassroomCourses } from "@/server/google/google-classroom";
import { getValidGoogleAccessTokenForScopes } from "@/server/google/google-token-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorStatusFor(message: string): number {
  if (/limitou temporariamente|resource_exhausted|quota|rate.?limit|429/i.test(message)) return 429;
  if (/login|nao conectada|n[aã]o conectada/i.test(message)) return 401;
  if (/autoriz|permiss|escopo|scope|reconecte/i.test(message)) return 403;
  return 400;
}

export async function GET(request: NextRequest) {
  const user = await resolvePlanifyUserFromRequest(request);

  if (!user) {
    return NextResponse.json(
      { success: false, error: { message: "Faca login no Planify." } },
      { status: 401 },
    );
  }

  try {
    const { accessToken, googleEmail } = await getValidGoogleAccessTokenForScopes(
      user.id,
      GOOGLE_CLASSROOM_COURSES_SCOPES,
      "Google Classroom",
    );
    const courses = await listGoogleClassroomCourses(accessToken);

    return NextResponse.json({
      success: true,
      courses,
      googleEmail,
      message:
        courses.length === 0
          ? "Nenhuma turma ativa encontrada para esta conta Google. Confira se voce e professor em alguma turma do Classroom."
          : undefined,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Nao foi possivel listar as turmas do Google Classroom.";

    return NextResponse.json(
      { success: false, courses: [], error: { message } },
      { status: errorStatusFor(message) },
    );
  }
}
