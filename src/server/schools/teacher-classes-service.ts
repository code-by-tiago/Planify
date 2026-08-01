import type { TablesInsert } from "@/types/database";
import { getSupabaseAdminClient } from "../supabase/admin-client";

export type TeacherClassRow = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

function normalizeClassName(name: string): string {
  return name.replace(/\s+/g, " ").trim();
}

export async function listTeacherClasses(userId: string): Promise<TeacherClassRow[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("teacher_classes")
    .select("id,user_id,name,created_at,updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as TeacherClassRow[];
}

export async function upsertTeacherClass(
  userId: string,
  rawName: string,
): Promise<TeacherClassRow | null> {
  const name = normalizeClassName(rawName);
  if (!name) {
    return null;
  }

  const supabase = getSupabaseAdminClient();
  const { data: existing, error: findError } = await supabase
    .from("teacher_classes")
    .select("id,user_id,name,created_at,updated_at")
    .eq("user_id", userId)
    .ilike("name", name)
    .maybeSingle();

  if (findError) {
    throw new Error(findError.message);
  }

  if (existing) {
    const { data, error } = await supabase
      .from("teacher_classes")
      .update({ name, updated_at: new Date().toISOString() })
      .eq("id", (existing as { id: string }).id)
      .select("id,user_id,name,created_at,updated_at")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as TeacherClassRow;
  }

  const row: TablesInsert<"teacher_classes"> = {
    user_id: userId,
    name,
  };

  const { data, error } = await supabase
    .from("teacher_classes")
    .insert(row)
    .select("id,user_id,name,created_at,updated_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as TeacherClassRow;
}
