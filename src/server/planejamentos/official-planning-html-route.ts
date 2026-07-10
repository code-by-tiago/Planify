import { NextRequest, NextResponse } from "next/server";
import { requireApiPremiumAccess } from "../auth/api-access";
import type { OfficialPlanningPayload } from "./official-planning-docx";
import { buildOfficialPlanningEditorHtml } from "./official-planning-editor-html";
import { parsePlanningDocxRequest } from "./planning-docx-service";

export async function handleOfficialPlanningHtmlPost(request: NextRequest) {
  const auth = await requireApiPremiumAccess(request);
  if (!auth.ok) return auth.response;

  try {
    const payload = (await parsePlanningDocxRequest(request)) as OfficialPlanningPayload & {
      documentType?: string;
      documentId?: string;
    };
    const result = buildOfficialPlanningEditorHtml(payload, {
      documentType:
        typeof payload.documentType === "string"
          ? payload.documentType
          : payload.tipoPlanejamento
            ? `planejamento:${payload.tipoPlanejamento}`
            : null,
      documentId: typeof payload.documentId === "string" ? payload.documentId : null,
    });

    return NextResponse.json({
      success: true,
      html: result.html,
      filename: result.filename,
      templateSource: "official",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Não foi possível gerar o HTML oficial do planejamento.",
        },
      },
      { status: 500 },
    );
  }
}
