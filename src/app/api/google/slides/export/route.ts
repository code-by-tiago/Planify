import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Produto Slides descontinuado — exportação para Google Slides não está mais disponível. */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: {
        message: "Exportação para Google Slides não está mais disponível.",
      },
    },
    { status: 410 },
  );
}
