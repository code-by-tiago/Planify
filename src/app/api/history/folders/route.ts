import { NextRequest, NextResponse } from "next/server";
import { requireApiAuthenticated } from "@/server/auth/api-access";
import { getSupabaseAdminClient } from "@/server/supabase/admin-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: { message } }, { status });
}

export async function GET(request: NextRequest) {
  const auth = await requireApiAuthenticated(request);
  if (!auth.ok) return auth.response;

  const userId = auth.access.user!.id;
  const supabase = getSupabaseAdminClient();
  const { data, error } = await (supabase as any)
    .from("material_folders")
    .select("id,school_label,class_label,created_at")
    .eq("user_id", userId)
    .order("school_label", { ascending: true });

  if (error) return jsonError(error.message, 500);

  return NextResponse.json({
    success: true,
    folders: (data || []).map((row: {
      id: string;
      school_label: string;
      class_label: string;
      created_at: string;
    }) => ({
      id: row.id,
      schoolLabel: row.school_label,
      classLabel: row.class_label,
      createdAt: row.created_at,
    })),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiAuthenticated(request);
  if (!auth.ok) return auth.response;

  const userId = auth.access.user!.id;
  const body = (await request.json().catch(() => null)) as {
    schoolLabel?: string;
    classLabel?: string;
  } | null;

  const schoolLabel = String(body?.schoolLabel || "").trim() || "Sem escola";
  const classLabel = String(body?.classLabel || "").trim();
  if (!classLabel) return jsonError("Informe a turma.", 400);

  const supabase = getSupabaseAdminClient();
  const { data, error } = await (supabase as any)
    .from("material_folders")
    .upsert(
      {
        user_id: userId,
        school_label: schoolLabel,
        class_label: classLabel,
      },
      { onConflict: "user_id,school_label,class_label" },
    )
    .select("id,school_label,class_label,created_at")
    .single();

  if (error || !data) return jsonError(error?.message || "Falha ao criar pasta.", 500);

  return NextResponse.json({
    success: true,
    folder: {
      id: data.id,
      schoolLabel: data.school_label,
      classLabel: data.class_label,
      createdAt: data.created_at,
    },
  });
}
