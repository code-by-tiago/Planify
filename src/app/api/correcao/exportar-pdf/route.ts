import { NextRequest, NextResponse } from "next/server";
import {
  buildCorrectionFeedbackPdf,
  type CorrectionPdfEntry,
} from "@/server/correcao/correction-feedback-pdf";
import { requireApiPremiumAccess } from "@/server/auth/api-access";
import type { CorrectionAiOutput } from "@/types/correction";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  resultados?: Array<{
    result: CorrectionAiOutput;
    meta?: {
      aluno?: string;
      componente?: string;
      data?: string;
    };
  }>;
  resultado?: CorrectionAiOutput;
  meta?: {
    aluno?: string;
    componente?: string;
    data?: string;
  };
};

export async function POST(request: NextRequest) {
  const auth = await requireApiPremiumAccess(request);
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => null)) as Body | null;

  const entries: CorrectionPdfEntry[] = [];

  if (Array.isArray(body?.resultados) && body.resultados.length) {
    for (const item of body.resultados.slice(0, 5)) {
      if (item?.result) {
        entries.push({ result: item.result, meta: item.meta });
      }
    }
  } else if (body?.resultado) {
    entries.push({ result: body.resultado, meta: body.meta });
  }

  if (!entries.length) {
    return NextResponse.json(
      { ok: false, message: "Informe ao menos um resultado de correção." },
      { status: 400 },
    );
  }

  try {
    const buffer = await buildCorrectionFeedbackPdf(entries);
    const filename =
      entries.length > 1
        ? `devolutivas-planify-${entries.length}.pdf`
        : "devolutiva-planify.pdf";

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao gerar PDF.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
