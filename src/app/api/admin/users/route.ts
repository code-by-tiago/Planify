import { NextRequest, NextResponse } from "next/server";
import type { UserRole } from "@/types/user";
import {
  createAdminUser,
  listAdminUsers,
} from "../../../../server/admin/platform-admin-service";
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

const VALID_ROLES = new Set<UserRole>(["teacher", "school_manager", "admin"]);

export async function POST(request: NextRequest) {
  const gate = await requireOwnerApi(request);
  if (!gate.ok) return gate.response;

  const body = (await request.json().catch(() => null)) as {
    email?: string;
    password?: string;
    fullName?: string;
    role?: UserRole;
    schoolId?: string;
    mode?: "password" | "invite";
  } | null;

  const role = body?.role || "teacher";
  if (!VALID_ROLES.has(role)) {
    return NextResponse.json(
      { success: false, error: { message: "Papel inválido." } },
      { status: 400 },
    );
  }

  const mode = body?.mode || (body?.password ? "password" : "invite");
  if (mode !== "password" && mode !== "invite") {
    return NextResponse.json(
      { success: false, error: { message: "Modo de criação inválido." } },
      { status: 400 },
    );
  }

  try {
    const user = await createAdminUser({
      email: String(body?.email || ""),
      password: body?.password,
      fullName: body?.fullName,
      role,
      schoolId: body?.schoolId,
      mode,
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao criar usuário.";
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 400 },
    );
  }
}
