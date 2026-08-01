import { NextRequest, NextResponse } from "next/server";
import { requireOwnerApi } from "../../../../server/auth/owner-access";
import { generateCommercialProposalPdf } from "../../../../server/pdf/commercial-proposal-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FILENAME = "proposta-comercial-b2b-planify.pdf";

export async function GET(request: NextRequest) {
  const gate = await requireOwnerApi(request);
  if (!gate.ok) return gate.response;

  try {
    const buffer = await generateCommercialProposalPdf();

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${FILENAME}"; filename*=UTF-8''${encodeURIComponent(FILENAME)}`,
        "X-Planify-Filename": FILENAME,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "pdf_generation_failed",
          message:
            error instanceof Error
              ? error.message
              : "Não foi possível gerar a proposta comercial em PDF.",
        },
      },
      { status: 500 },
    );
  }
}
