import { NextRequest, NextResponse } from "next/server";
import { requireApiAuthenticated } from "@/server/auth/api-access";
import { listSchoolPendingInvites } from "@/server/schools/school-invite-service";
import { getSchoolLicenseInfo } from "@/server/schools/school-license";
import { requireSchoolDashboardAccess } from "@/server/schools/school-access";
import {
  ensurePrimarySchoolIdForUser,
  listSchoolMembers,
} from "@/server/schools/school-service";
import type { SchoolTeacherMember } from "@/lib/school/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireApiAuthenticated(request);
  if (!auth.ok) return auth.response;

  const userId = auth.access.user?.id;
  if (!userId) {
    return NextResponse.json(
      { success: false, error: { message: "Usuário não identificado." } },
      { status: 401 },
    );
  }

  const schoolId = await ensurePrimarySchoolIdForUser(userId);
  if (!schoolId) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            "Nenhuma escola vinculada ao gestor. Peça ao suporte para associar sua conta.",
        },
      },
      { status: 400 },
    );
  }

  const access = await requireSchoolDashboardAccess(userId, schoolId);
  if (!access.ok) {
    return NextResponse.json(
      { success: false, error: { message: access.message } },
      { status: 403 },
    );
  }

  try {
    const [members, pendingInvites, license] = await Promise.all([
      listSchoolMembers(schoolId),
      listSchoolPendingInvites(schoolId),
      getSchoolLicenseInfo(schoolId),
    ]);

    type MemberRow = {
      id: string;
      user_id: string;
      role: string;
      status: string;
      created_at: string;
      profile?: { email?: string; fullName?: string } | null;
    };

    const activeTeachers: SchoolTeacherMember[] = (members as MemberRow[])
      .filter((row) => row.role === "teacher" && row.status === "active")
      .map((row) => ({
        id: String(row.id),
        userId: String(row.user_id),
        role: String(row.role),
        status: String(row.status),
        email: row.profile?.email ? String(row.profile.email) : null,
        fullName: row.profile?.fullName ? String(row.profile.fullName) : null,
        createdAt: String(row.created_at),
      }));

    return NextResponse.json({
      success: true,
      teachers: {
        schoolId,
        activeTeachers,
        pendingInvites,
        license: {
          institutionalPlan: license.institutionalPlan,
          planLabel: license.planLabel,
          teacherLimit: license.teacherLimit,
          activeTeachers: license.activeTeachers,
          pendingInvites: license.pendingInvites,
          seatsUsed: license.seatsUsed,
          seatsAvailable: license.seatsAvailable,
        },
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao listar professores.";
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 500 },
    );
  }
}
