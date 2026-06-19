import {
  fetchTeachingContextFromServer,
  saveTeachingContextToServer,
} from "@/lib/auth/teaching-context-client";
import {
  DEFAULT_TEACHING_CONTEXT,
  type TeacherTeachingContext,
  type TeachingContextFields,
} from "@/types/teaching-context";

const CONTEXT_KEY = "planify:teacher:teaching-context";

let syncTimer: ReturnType<typeof setTimeout> | null = null;
let pendingSyncContext: TeacherTeachingContext | null = null;

function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

function mergeTeachingContexts(
  local: TeacherTeachingContext,
  remote: TeacherTeachingContext,
): TeacherTeachingContext {
  const localTime = new Date(local.updatedAt).getTime();
  const remoteTime = new Date(remote.updatedAt).getTime();

  if (!Number.isFinite(remoteTime)) return local;
  if (!Number.isFinite(localTime)) return remote;

  return remoteTime >= localTime ? remote : local;
}

function normalizeLocalContext(
  parsed: Partial<TeacherTeachingContext>,
): TeacherTeachingContext {
  return {
    ...DEFAULT_TEACHING_CONTEXT,
    ...parsed,
    classId: parsed.classId ?? null,
    updatedAt: parsed.updatedAt || new Date().toISOString(),
  };
}

export function loadTeacherTeachingContext(): TeacherTeachingContext {
  if (!canUseStorage()) return DEFAULT_TEACHING_CONTEXT;

  try {
    const raw = window.localStorage.getItem(CONTEXT_KEY);
    if (!raw) return DEFAULT_TEACHING_CONTEXT;
    const parsed = JSON.parse(raw) as Partial<TeacherTeachingContext>;
    return normalizeLocalContext(parsed);
  } catch {
    return DEFAULT_TEACHING_CONTEXT;
  }
}

function writeLocalContext(context: TeacherTeachingContext): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(CONTEXT_KEY, JSON.stringify(context));
}

function scheduleSyncToServer(context: TeacherTeachingContext): void {
  pendingSyncContext = context;

  if (syncTimer) {
    clearTimeout(syncTimer);
  }

  syncTimer = setTimeout(() => {
    const toSync = pendingSyncContext;
    pendingSyncContext = null;
    syncTimer = null;
    if (!toSync) return;
    void saveTeachingContextToServer(toSync);
  }, 400);
}

export function saveTeacherTeachingContext(
  context: TeacherTeachingContext,
): void {
  const next = {
    ...context,
    updatedAt: new Date().toISOString(),
  };
  writeLocalContext(next);
  scheduleSyncToServer(next);
}

export async function syncTeacherTeachingContextFromServer(): Promise<TeacherTeachingContext> {
  const local = loadTeacherTeachingContext();
  const remote = await fetchTeachingContextFromServer();

  if (!remote) {
    return local;
  }

  const merged = mergeTeachingContexts(local, remote);
  writeLocalContext(merged);
  return merged;
}

export function buildTeachingContextFromFields(
  fields: TeachingContextFields,
): TeacherTeachingContext {
  return {
    etapa: fields.etapa.trim(),
    anoSerie: fields.anoSerie.trim(),
    areaConhecimento: fields.areaConhecimento.trim(),
    componente: fields.componente.trim(),
    turma: fields.turma.trim(),
    classId: fields.classId,
    observacoesTurma: fields.observacoesTurma.trim(),
    updatedAt: new Date().toISOString(),
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
