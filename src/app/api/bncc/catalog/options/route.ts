import { NextRequest, NextResponse } from "next/server";
import { requireApiAuthenticated } from "@/server/auth/api-access";
import { getBnccCatalogOptions } from "@/server/bncc/bncc-catalog-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireApiAuthenticated(request);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const stage = searchParams.get("stage") || undefined;
  const grade = searchParams.get("grade") || undefined;
  const knowledgeArea =
    searchParams.get("area") || searchParams.get("knowledgeArea") || undefined;

  try {
    const options = await getBnccCatalogOptions({ stage, grade, knowledgeArea });

    return NextResponse.json({
      success: true,
      options,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível carregar opções BNCC.";
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 500 },
    );
  }
}
