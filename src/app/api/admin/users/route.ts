import { NextRequest, NextResponse } from "next/server";
import { listAdminUsers } from "../../../../server/admin/platform-admin-service";
import { requireOwnerApi } from "../../../../server/auth/owner-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const gate = await requireOwnerApi(request);
  if (!gate.ok) return gate.response;

  const q = request.nextUrl.searchParams.get("q") || undefined;
  const limit = Number(request.nextUrl.searchParams.get("limit") || "50");

  try {
    const result = await listAdminUsers({ q, limit });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao listar usuários.";
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 500 },
    );
  }
}
