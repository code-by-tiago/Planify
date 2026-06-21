import {
  DEFAULT_TEACHING_CONTEXT,
  type TeacherTeachingContext,
} from "@/types/teaching-context";
import type { Json } from "@/types/database";
import { getSupabaseAdminClient } from "../supabase/admin-client";

export { DEFAULT_TEACHING_CONTEXT };

function trim(value: unknown, max = 200): string {
  return String(value ?? "").trim().slice(0, max);
}

export function sanitizeTeachingContext(raw: unknown): TeacherTeachingContext {
  const parsed = (
    raw && typeof raw === "object" ? raw : {}
  ) as Partial<TeacherTeachingContext>;

  return {
    etapa: trim(parsed.etapa),
    anoSerie: trim(parsed.anoSerie),
    areaConhecimento: trim(parsed.areaConhecimento),
    componente: trim(parsed.componente),
    turma: trim(parsed.turma, 120),
    classId: parsed.classId ? trim(parsed.classId, 64) : null,
    observacoesTurma: trim(parsed.observacoesTurma, 500),
    updatedAt:
      typeof parsed.updatedAt === "string" && parsed.updatedAt.trim()
        ? parsed.updatedAt
        : new Date().toISOString(),
  };
}

export function isTeachingContextConfigured(
  context: TeacherTeachingContext,
): boolean {
  return Boolean(
    context.etapa.trim() ||
      context.anoSerie.trim() ||
      context.componente.trim() ||
      context.turma.trim(),
  );
}

export function mergeTeachingContexts(
  local: TeacherTeachingContext,
  remote: TeacherTeachingContext,
): TeacherTeachingContext {
  const localTime = new Date(local.updatedAt).getTime();
  const remoteTime = new Date(remote.updatedAt).getTime();

  if (!Number.isFinite(remoteTime)) return local;
  if (!Number.isFinite(localTime)) return remote;

  return remoteTime >= localTime ? remote : local;
}

export async function getTeachingContext(
  userId: string,
): Promise<TeacherTeachingContext> {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("teaching_context")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.teaching_context) {
    return {
      ...DEFAULT_TEACHING_CONTEXT,
      updatedAt: new Date().toISOString(),
    };
  }

  return sanitizeTeachingContext(data.teaching_context);
}

export async function upsertTeachingContext(
  userId: string,
  context: TeacherTeachingContext,
): Promise<TeacherTeachingContext> {
  const existing = await getTeachingContext(userId);
  const incoming = sanitizeTeachingContext({
    ...context,
    updatedAt: new Date().toISOString(),
  });

  const merged = mergeTeachingContexts(existing, incoming);
  const toSave = sanitizeTeachingContext({
    ...merged,
    updatedAt: new Date().toISOString(),
  });

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("profiles")
    .update({ teaching_context: toSave as unknown as Json })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return toSave;
}
