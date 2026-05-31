import { NextRequest, NextResponse } from "next/server";
import {
  buildOfficialPlanningDocx,
  getOfficialPlanningFilename,
  type OfficialPlanningPayload,
} from "./official-planning-docx";

export async function handleOfficialPlanningDocxPost(request: NextRequest) {
  try {
    const payload = (await request.json()) as OfficialPlanningPayload;
    const buffer = buildOfficialPlanningDocx(payload);
    const filename = getOfficialPlanningFilename(payload);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}.docx"; filename*=UTF-8''${encodeURIComponent(filename)}.docx`,
        "Cache-Control": "no-store",
      },
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
    },
    { status: 200 },
  );
}
