import { NextRequest, NextResponse } from "next/server";
import { resolvePlanifyUserFromRequest } from "@/server/google/google-auth";
import { createLessonExecutionSession } from "@/server/lesson-execution/interactive-session-service";
import { jsonLessonExecutionError } from "@/app/api/aula-executavel/_utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await resolvePlanifyUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: "Faca login para iniciar o Modo Aula." } },
        { status: 401 },
      );
    }

    const body = (await request.json().catch(() => null)) as {
      title?: unknown;
      html?: unknown;
      documentType?: unknown;
    } | null;

    if (!body) {
      return NextResponse.json(
        { success: false, error: { message: "Corpo da requisicao invalido." } },
        { status: 400 },
      );
    }

    const session = await createLessonExecutionSession({
      teacherId: user.id,
      title: String(body.title || ""),
      html: String(body.html || ""),
      documentType: String(body.documentType || "material:plano-aula"),
    });

    return NextResponse.json({ success: true, data: session });
  } catch (error) {
    return jsonLessonExecutionError(error);
  }
}
