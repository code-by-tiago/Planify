import { NextRequest, NextResponse } from "next/server";
import { submitLessonExecutionResponse } from "@/server/lesson-execution/interactive-session-service";
import { jsonLessonExecutionError } from "@/app/api/aula-executavel/_utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ code: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { code } = await context.params;
    const body = (await request.json().catch(() => null)) as {
      participantId?: unknown;
      questionId?: unknown;
      answer?: unknown;
    } | null;

    if (!body) {
      return NextResponse.json(
        { success: false, error: { message: "Corpo da requisicao invalido." } },
        { status: 400 },
      );
    }

    const data = await submitLessonExecutionResponse({
      code,
      participantId: String(body.participantId || ""),
      questionId: String(body.questionId || ""),
      answer: String(body.answer || ""),
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return jsonLessonExecutionError(error);
  }
}
