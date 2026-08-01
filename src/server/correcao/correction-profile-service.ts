import type {
  CorrectionRigor,
  CorrectionTone,
  TeacherCorrectionProfile,
} from "@/types/correction";
import type { Json } from "@/types/database";
import { getSupabaseAdminClient } from "../supabase/admin-client";

const MAX_EXAMPLES = 6;
const MAX_SNIPPET = 280;

const VALID_TONES = new Set<CorrectionTone>([
  "encorajador",
  "direto",
  "detalhado",
]);
const VALID_RIGOR = new Set<CorrectionRigor>([
  "flexivel",
  "balanceado",
  "rigoroso",
]);

export const DEFAULT_CORRECTION_PROFILE: TeacherCorrectionProfile = {
  tom: "encorajador",
  rigor: "balanceado",
  foco: ["clareza", "conteúdo", "organização"],
  exemplosFeedback: [],
  updatedAt: new Date(0).toISOString(),
};

export function sanitizeCorrectionProfile(
  raw: unknown,
): TeacherCorrectionProfile {
  const parsed = (
    raw && typeof raw === "object" ? raw : {}
  ) as Partial<TeacherCorrectionProfile>;

  return {
    tom: VALID_TONES.has(parsed.tom as CorrectionTone)
      ? (parsed.tom as CorrectionTone)
      : DEFAULT_CORRECTION_PROFILE.tom,
    rigor: VALID_RIGOR.has(parsed.rigor as CorrectionRigor)
      ? (parsed.rigor as CorrectionRigor)
      : DEFAULT_CORRECTION_PROFILE.rigor,
    foco: Array.isArray(parsed.foco)
      ? parsed.foco.map(String).filter(Boolean).slice(0, 10)
      : DEFAULT_CORRECTION_PROFILE.foco,
    exemplosFeedback: Array.isArray(parsed.exemplosFeedback)
      ? parsed.exemplosFeedback
          .map((entry) => String(entry).slice(0, MAX_SNIPPET))
          .slice(0, MAX_EXAMPLES)
      : [],
    updatedAt:
      typeof parsed.updatedAt === "string" && parsed.updatedAt.trim()
        ? parsed.updatedAt
        : new Date().toISOString(),
  };
}

export function mergeCorrectionProfiles(
  local: TeacherCorrectionProfile,
  remote: TeacherCorrectionProfile,
): TeacherCorrectionProfile {
  const localTime = new Date(local.updatedAt).getTime();
  const remoteTime = new Date(remote.updatedAt).getTime();

  if (!Number.isFinite(remoteTime)) return local;
  if (!Number.isFinite(localTime)) return remote;

  return remoteTime >= localTime ? remote : local;
}

export async function getCorrectionProfile(
  userId: string,
): Promise<TeacherCorrectionProfile> {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("correction_profile")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.correction_profile) {
    return {
      ...DEFAULT_CORRECTION_PROFILE,
      updatedAt: new Date().toISOString(),
    };
  }

  return sanitizeCorrectionProfile(data.correction_profile);
}

export async function upsertCorrectionProfile(
  userId: string,
  profile: TeacherCorrectionProfile,
): Promise<TeacherCorrectionProfile> {
  const existing = await getCorrectionProfile(userId);
  const incoming = sanitizeCorrectionProfile({
    ...profile,
    updatedAt: new Date().toISOString(),
  });

  const merged = mergeCorrectionProfiles(existing, incoming);
  const toSave = sanitizeCorrectionProfile({
    ...merged,
    updatedAt: new Date().toISOString(),
  });

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("profiles")
    .update({ correction_profile: toSave as unknown as Json })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return toSave;
}
