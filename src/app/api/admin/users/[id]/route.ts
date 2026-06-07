import { NextRequest, NextResponse } from "next/server";
import type { UserRole, UserStatus } from "@/types/user";
import { updateAdminUser } from "../../../../../server/admin/platform-admin-service";
import { requireOwnerApi } from "../../../../../server/auth/owner-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_ROLES = new Set<UserRole>(["teacher", "school_manager", "admin"]);
const VALID_STATUSES = new Set<UserStatus>([
  "active",
  "inactive",
  "pending",
  "blocked",
]);

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const gate = await requireOwnerApi(request);
  if (!gate.ok) return gate.response;

  const { id } = await context.params;
  const userId = String(id || "").trim();

  if (!userId) {
    return NextResponse.json(
      { success: false, error: { message: "Informe o id do usuário." } },
      { status: 400 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    role?: UserRole;
    status?: UserStatus;
    fullName?: string | null;
  } | null;

  if (body?.role !== undefined && !VALID_ROLES.has(body.role)) {
    return NextResponse.json(
      { success: false, error: { message: "Papel inválido." } },
      { status: 400 },
    );
  }

  if (body?.status !== undefined && !VALID_STATUSES.has(body.status)) {
    return NextResponse.json(
      { success: false, error: { message: "Status inválido." } },
      { status: 400 },
    );
  }

  try {
    const user = await updateAdminUser(userId, {
      role: body?.role,
      status: body?.status,
      fullName: body?.fullName,
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao atualizar usuário.";
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 400 },
    );
  }
}
