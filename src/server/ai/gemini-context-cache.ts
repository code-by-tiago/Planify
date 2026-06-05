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

function getAIApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY não configurada no servidor.");
  }

  return apiKey;
}

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
  apiKey: string,
  model: string,
  profile: string,
  bundle: GeminiCacheBundle,
): Promise<string | null> {
  const body: Record<string, unknown> = {
    model: `models/${model}`,
    displayName: `planify-${profile}`.slice(0, 120),
    systemInstruction: {
      parts: [{ text: bundle.systemInstruction }],
    },
    ttl: `${cacheTtlSeconds()}s`,
  };

  if (bundle.staticContext?.trim()) {
    body.contents = [
      {
        role: "user",
        parts: [{ text: bundle.staticContext.trim() }],
      },
    ];
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/cachedContents?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  const json = (await response.json()) as {
    name?: string;
    error?: { message?: string };
  };

  if (!response.ok || !json.name) {
    return null;
  }

  return json.name;
}

export async function resolveGeminiCachedContentName(
  profile: string,
  model: string,
  bundle: GeminiCacheBundle,
): Promise<string | null> {
  if (!isGeminiContextCacheEnabled()) {
    return null;
  }

  const storeKey = buildStoreKey(profile, model);
  const existing = cacheStore.get(storeKey);

  if (existing && existing.model === model && existing.expiresAt > Date.now()) {
    return existing.name;
  }

  try {
    const apiKey = getAIApiKey();
    const name = await createCachedContent(apiKey, model, profile, bundle);

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
