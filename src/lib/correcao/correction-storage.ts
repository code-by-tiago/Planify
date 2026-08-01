import {
  fetchCorrectionProfileFromServer,
  saveCorrectionProfileToServer,
} from "@/lib/correcao/correction-profile-client";
import type { TeacherCorrectionProfile } from "@/types/correction";

function mergeCorrectionProfiles(
  local: TeacherCorrectionProfile,
  remote: TeacherCorrectionProfile,
): TeacherCorrectionProfile {
  const localTime = new Date(local.updatedAt).getTime();
  const remoteTime = new Date(remote.updatedAt).getTime();

  if (!Number.isFinite(remoteTime)) return local;
  if (!Number.isFinite(localTime)) return remote;

  return remoteTime >= localTime ? remote : local;
}

const PROFILE_KEY = "planify:correcao:teacher-profile";
const MAX_EXAMPLES = 6;

const DEFAULT_PROFILE: TeacherCorrectionProfile = {
  tom: "encorajador",
  rigor: "balanceado",
  foco: ["clareza", "conteúdo", "organização"],
  exemplosFeedback: [],
  updatedAt: new Date().toISOString(),
};

let syncTimer: ReturnType<typeof setTimeout> | null = null;
let pendingSyncProfile: TeacherCorrectionProfile | null = null;

function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

function normalizeLocalProfile(
  parsed: Partial<TeacherCorrectionProfile>,
): TeacherCorrectionProfile {
  return {
    ...DEFAULT_PROFILE,
    ...parsed,
    exemplosFeedback: Array.isArray(parsed.exemplosFeedback)
      ? parsed.exemplosFeedback.map(String).slice(0, MAX_EXAMPLES)
      : [],
    updatedAt: parsed.updatedAt || new Date().toISOString(),
  };
}

export function loadTeacherCorrectionProfile(): TeacherCorrectionProfile {
  if (!canUseStorage()) return DEFAULT_PROFILE;

  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw) as Partial<TeacherCorrectionProfile>;
    return normalizeLocalProfile(parsed);
  } catch {
    return DEFAULT_PROFILE;
  }
}

function writeLocalProfile(profile: TeacherCorrectionProfile): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

function scheduleSyncToServer(profile: TeacherCorrectionProfile): void {
  pendingSyncProfile = profile;

  if (syncTimer) {
    clearTimeout(syncTimer);
  }

  syncTimer = setTimeout(() => {
    const toSync = pendingSyncProfile;
    pendingSyncProfile = null;
    syncTimer = null;
    if (!toSync) return;
    void saveCorrectionProfileToServer(toSync);
  }, 400);
}

export function saveTeacherCorrectionProfile(
  profile: TeacherCorrectionProfile,
): void {
  const next = {
    ...profile,
    updatedAt: new Date().toISOString(),
  };
  writeLocalProfile(next);
  scheduleSyncToServer(next);
}

export async function syncTeacherCorrectionProfileFromServer(): Promise<TeacherCorrectionProfile> {
  const local = loadTeacherCorrectionProfile();
  const remote = await fetchCorrectionProfileFromServer();

  if (!remote) {
    return local;
  }

  const merged = mergeCorrectionProfiles(local, remote);
  writeLocalProfile(merged);
  return merged;
}

export function learnFromCorrectionFeedback(feedbackGeral: string): void {
  const trimmed = feedbackGeral.trim();
  if (!trimmed || trimmed.length < 40) return;

  const profile = loadTeacherCorrectionProfile();
  const snippet = trimmed.slice(0, 280);
  const next = [
    snippet,
    ...profile.exemplosFeedback.filter((entry) => entry !== snippet),
  ].slice(0, MAX_EXAMPLES);

  saveTeacherCorrectionProfile({
    ...profile,
    exemplosFeedback: next,
  });
}
