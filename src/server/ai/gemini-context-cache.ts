import { getGeminiApiKey, getGeminiSdk } from "./gemini-sdk";

const CACHE_CREATE_TIMEOUT_MS = 20_000;

type GeminiCacheRecord = {
  name: string;
  model: string;
  expiresAt: number;
};

type GeminiCacheBundle = {
  systemInstruction: string;
  staticContext?: string;
};

const cacheStore = new Map<string, GeminiCacheRecord>();

export function isGeminiContextCacheEnabled(): boolean {
  const flag = String(process.env.GEMINI_CONTEXT_CACHE ?? "1").trim().toLowerCase();
  return flag !== "0" && flag !== "false" && flag !== "off";
}

function cacheTtlSeconds(): number {
  const raw = Number.parseInt(process.env.GEMINI_CONTEXT_CACHE_TTL_SECONDS || "3600", 10);
  return Number.isFinite(raw) && raw >= 300 ? raw : 3600;
}

function buildStoreKey(profile: string, model: string): string {
  return `${profile}::${model}`;
}

async function createCachedContent(
  model: string,
  profile: string,
  bundle: GeminiCacheBundle,
): Promise<string | null> {
  try {
    const created = await Promise.race([
      getGeminiSdk().caches.create({
        model: model.startsWith("models/") ? model : `models/${model}`,
        config: {
          displayName: `planify-${profile}`.slice(0, 120),
          ttl: `${cacheTtlSeconds()}s`,
          systemInstruction: bundle.systemInstruction,
          ...(bundle.staticContext?.trim()
            ? {
                contents: [
                  {
                    role: "user",
                    parts: [{ text: bundle.staticContext.trim() }],
                  },
                ],
              }
            : {}),
        },
      }),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error("Timeout ao preparar cache de contexto da IA."));
        }, CACHE_CREATE_TIMEOUT_MS);
      }),
    ]);

    return created.name ?? null;
  } catch {
    return null;
  }
}

export async function resolveGeminiCachedContentName(
  profile: string,
  model: string,
  bundle: GeminiCacheBundle,
): Promise<string | null> {
  if (!isGeminiContextCacheEnabled()) {
    return null;
  }

  getGeminiApiKey();

  const storeKey = buildStoreKey(profile, model);
  const existing = cacheStore.get(storeKey);

  if (existing && existing.model === model && existing.expiresAt > Date.now()) {
    return existing.name;
  }

  try {
    const name = await createCachedContent(model, profile, bundle);

    if (!name) {
      return null;
    }

    cacheStore.set(storeKey, {
      name,
      model,
      expiresAt: Date.now() + cacheTtlSeconds() * 1000 - 30_000,
    });

    return name;
  } catch {
    return null;
  }
}
