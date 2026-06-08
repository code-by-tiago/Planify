import { NextRequest, NextResponse } from "next/server";
import { requireApiPremiumAccess } from "../auth/api-access";
import {
  buildPlanningDocx,
  parsePlanningDocxRequest,
} from "./planning-docx-service";

export async function handleOfficialPlanningDocxPost(request: NextRequest) {
  const auth = await requireApiPremiumAccess(request);
  if (!auth.ok) return auth.response;

  try {
    const { payload, customTemplate } = await parsePlanningDocxRequest(request);
    const result = buildPlanningDocx(payload, customTemplate);

    const headers: Record<string, string> = {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${result.filename}.docx"; filename*=UTF-8''${encodeURIComponent(result.filename)}.docx`,
      "X-Planify-Filename": `${result.filename}.docx`,
      "X-Planify-Template-Source": result.templateSource,
      "Cache-Control": "no-store",
    };

    if (result.usedFallback) {
      headers["X-Planify-Template-Fallback"] = "true";
      if (result.fallbackMessage) {
        headers["X-Planify-Template-Message"] = result.fallbackMessage;
      }
    }

    return new NextResponse(new Uint8Array(result.buffer), {
      status: 200,
      headers,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Não foi possível gerar o planejamento DOCX.",
        },
      },
      { status: 500 },
    );
  }
}

export async function handleOfficialPlanningDocxGet() {
  return NextResponse.json(
    {
      success: true,
      message:
        "Motor de planejamento DOCX oficial ativo. Use POST com dados do planejamento.",
      endpoints: [
        "/api/planejamentos/docx-oficial",
        "/api/planejamentos/gerar-docx",
        "/api/planejamentos/docx",
      ],
      customTemplate: {
        supported: true,
        maxBytes: 10 * 1024 * 1024,
        extension: ".docx",
        multipartFields: ["payload", "template"],
      },
    },
    { status: 200 },
  );
}
