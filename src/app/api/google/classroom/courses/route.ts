import { NextRequest, NextResponse } from "next/server";
import { resolvePlanifyUserFromRequest } from "../../../../../server/google/google-auth";
import { listGoogleClassroomCourses } from "../../../../../server/google/google-classroom";
import { GOOGLE_CLASSROOM_REQUIRED_SCOPES } from "../../../../../server/google/google-config";
import { getValidGoogleAccessTokenForScopes } from "../../../../../server/google/google-token-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await resolvePlanifyUserFromRequest(request);

  if (!user) {
    return NextResponse.json(
      { success: false, error: { message: "Faça login no Planify." } },
      { status: 401 },
    );
  }

  try {
    const { accessToken } = await getValidGoogleAccessTokenForScopes(
      user.id,
      GOOGLE_CLASSROOM_REQUIRED_SCOPES,
      "Google Classroom",
    );
    const courses = await listGoogleClassroomCourses(accessToken);

    return NextResponse.json({ success: true, courses });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Não foi possível listar turmas do Classroom.",
        },
      },
      { status: 400 },
    );
  }
}
