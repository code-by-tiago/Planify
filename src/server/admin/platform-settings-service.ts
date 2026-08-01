import { getSupabaseAdminClient } from "../supabase/admin-client";

export type PlatformSettings = {
  registrationsEnabled: boolean;
  defaultAiModel: string;
  updatedAt: string;
};

const DEFAULT_SETTINGS: PlatformSettings = {
  registrationsEnabled: true,
  defaultAiModel: "gemini-2.5-flash",
  updatedAt: new Date(0).toISOString(),
};

let cachedSettings: PlatformSettings | null = null;
let cacheFetchedAt = 0;
const CACHE_TTL_MS = 30_000;

function parseBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function parseModel(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  return fallback;
}

export function invalidatePlatformSettingsCache(): void {
  cachedSettings = null;
  cacheFetchedAt = 0;
}

export function getPlatformSettingsSync(): PlatformSettings {
  if (cachedSettings && Date.now() - cacheFetchedAt < CACHE_TTL_MS) {
    return cachedSettings;
  }

  const fromEnv =
    process.env.GEMINI_MODEL_DEFAULT ??
    process.env.GEMINI_MODEL ??
    DEFAULT_SETTINGS.defaultAiModel;

  return {
    registrationsEnabled: true,
    defaultAiModel: fromEnv,
    updatedAt: new Date().toISOString(),
  };
}

export async function fetchPlatformSettings(): Promise<PlatformSettings> {
  if (cachedSettings && Date.now() - cacheFetchedAt < CACHE_TTL_MS) {
    return cachedSettings;
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("platform_settings")
      .select("key,value,updated_at");

    if (error || !Array.isArray(data) || data.length === 0) {
      const fallback = getPlatformSettingsSync();
      cachedSettings = fallback;
      cacheFetchedAt = Date.now();
      return fallback;
    }

    const byKey = new Map<string, { value: unknown; updatedAt: string }>();
    let latestUpdatedAt = DEFAULT_SETTINGS.updatedAt;

    for (const row of data as Array<{
      key: string;
      value: unknown;
      updated_at: string;
    }>) {
      byKey.set(row.key, { value: row.value, updatedAt: row.updated_at });
      if (row.updated_at > latestUpdatedAt) {
        latestUpdatedAt = row.updated_at;
      }
    }

    const registrationsRow = byKey.get("registrations_enabled");
    const modelRow = byKey.get("default_ai_model");

    const settings: PlatformSettings = {
      registrationsEnabled: parseBoolean(
        registrationsRow?.value,
        DEFAULT_SETTINGS.registrationsEnabled,
      ),
      defaultAiModel: parseModel(
        modelRow?.value,
        process.env.GEMINI_MODEL_DEFAULT ??
          process.env.GEMINI_MODEL ??
          DEFAULT_SETTINGS.defaultAiModel,
      ),
      updatedAt: latestUpdatedAt,
    };

    cachedSettings = settings;
    cacheFetchedAt = Date.now();
    return settings;
  } catch {
    const fallback = getPlatformSettingsSync();
    cachedSettings = fallback;
    cacheFetchedAt = Date.now();
    return fallback;
  }
}

export async function updatePlatformSettings(
  patch: Partial<Pick<PlatformSettings, "registrationsEnabled" | "defaultAiModel">>,
): Promise<PlatformSettings> {
  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();

  if (typeof patch.registrationsEnabled === "boolean") {
    const { error } = await supabase.from("platform_settings").upsert(
      {
        key: "registrations_enabled",
        value: patch.registrationsEnabled,
        updated_at: now,
      },
      { onConflict: "key" },
    );

    if (error) {
      throw new Error(error.message);
    }
  }

  if (typeof patch.defaultAiModel === "string" && patch.defaultAiModel.trim()) {
    const { error } = await supabase.from("platform_settings").upsert(
      {
        key: "default_ai_model",
        value: patch.defaultAiModel.trim(),
        updated_at: now,
      },
      { onConflict: "key" },
    );

    if (error) {
      throw new Error(error.message);
    }
  }

  invalidatePlatformSettingsCache();
  return fetchPlatformSettings();
}

export async function areRegistrationsEnabled(): Promise<boolean> {
  const settings = await fetchPlatformSettings();
  return settings.registrationsEnabled;
}

export async function getDefaultAiModelFromSettings(): Promise<string> {
  const settings = await fetchPlatformSettings();
  return settings.defaultAiModel;
}
