import { NextRequest, NextResponse } from "next/server";
import { resolvePlanifyUserFromRequest } from "@/server/google/google-auth";
import {
  getTeacherLessonExecutionSession,
  updateTeacherLessonExecutionSession,
  type LessonExecutionSessionStatus,
} from "@/server/lesson-execution/interactive-session-service";
import { jsonLessonExecutionError } from "@/app/api/aula-executavel/_utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ sessionId: string }>;
};

const VALID_STATUSES = new Set(["ready", "live", "paused", "ended"]);

async function requireTeacher(request: NextRequest) {
  const user = await resolvePlanifyUserFromRequest(request);
  if (!user) {
    throw Object.assign(new Error("Faca login para controlar esta aula."), {
      status: 401,
    });
  }
  return user;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireTeacher(request);
    const { sessionId } = await context.params;
    const session = await getTeacherLessonExecutionSession({
      teacherId: user.id,
      sessionId,
    });

    return NextResponse.json({ success: true, data: session });
  } catch (error) {
    return jsonLessonExecutionError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireTeacher(request);
    const { sessionId } = await context.params;
    const body = (await request.json().catch(() => null)) as {
      activeSlideIndex?: unknown;
      activeQuestionId?: unknown;
      status?: unknown;
    } | null;

    if (!body) {
      return NextResponse.json(
        { success: false, error: { message: "Corpo da requisicao invalido." } },
        { status: 400 },
      );
    }

    const statusValue = typeof body.status === "string" ? body.status : undefined;
    if (statusValue && !VALID_STATUSES.has(statusValue)) {
      return NextResponse.json(
        { success: false, error: { message: "Status da aula inválido." } },
        { status: 400 },
      );
    }

    const status = statusValue as LessonExecutionSessionStatus | undefined;

    const session = await updateTeacherLessonExecutionSession({
      teacherId: user.id,
      sessionId,
      activeSlideIndex:
        typeof body.activeSlideIndex === "number"
          ? body.activeSlideIndex
          : undefined,
      activeQuestionId:
        body.activeQuestionId === null || typeof body.activeQuestionId === "string"
          ? body.activeQuestionId
          : undefined,
      status,
    });

    return NextResponse.json({ success: true, data: session });
  } catch (error) {
    return jsonLessonExecutionError(error);
  }
}
