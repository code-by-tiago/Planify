import { NextRequest, NextResponse } from "next/server";
import {
  getPublicLessonExecutionSession,
  joinLessonExecutionSession,
} from "@/server/lesson-execution/interactive-session-service";
import { jsonLessonExecutionError } from "@/app/api/aula-executavel/_utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ code: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { code } = await context.params;
    const session = await getPublicLessonExecutionSession(code);
    return NextResponse.json({ success: true, data: session });
  } catch (error) {
    return jsonLessonExecutionError(error);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { code } = await context.params;
    const body = (await request.json().catch(() => null)) as {
      displayName?: unknown;
      deviceToken?: unknown;
    } | null;

    if (!body) {
      return NextResponse.json(
        { success: false, error: { message: "Corpo da requisicao invalido." } },
        { status: 400 },
      );
    }

    const data = await joinLessonExecutionSession({
      code,
      displayName: String(body.displayName || ""),
      deviceToken: String(body.deviceToken || ""),
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return jsonLessonExecutionError(error);
  }
}
