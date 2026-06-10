import "server-only";

const robotsCache = new Map<string, { allowed: boolean; expiresAt: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function parseRobotsTxt(text: string, path: string, userAgent: string): boolean {
  const lines = text.split("\n").map((l) => l.trim());
  const groups: Array<{ agents: string[]; rules: Array<{ type: "allow" | "disallow"; path: string }> }> = [];
  let current: (typeof groups)[number] | null = null;

  for (const line of lines) {
    if (!line || line.startsWith("#")) continue;
    const [directive, ...rest] = line.split(":");
    const value = rest.join(":").trim();
    const key = directive.toLowerCase();

    if (key === "user-agent") {
      current = { agents: [value.toLowerCase()], rules: [] };
      groups.push(current);
    } else if (current && key === "disallow") {
      current.rules.push({ type: "disallow", path: value || "/" });
    } else if (current && key === "allow") {
      current.rules.push({ type: "allow", path: value || "/" });
    }
  }

  const ua = userAgent.toLowerCase();
  const matching = groups.filter(
    (g) => g.agents.includes("*") || g.agents.some((a) => ua.includes(a)),
  );

  for (const group of matching) {
    for (const rule of group.rules) {
      if (rule.path === "/" && rule.type === "disallow" && !rule.path) continue;
      if (path.startsWith(rule.path) && rule.type === "disallow") {
        return false;
      }
    }
  }

  return true;
}

export async function isRobotsAllowed(
  url: string,
  userAgent: string,
): Promise<boolean> {
  try {
    const parsed = new URL(url);
    const cacheKey = `${parsed.origin}|${userAgent}`;
    const cached = robotsCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.allowed;
    }

    const robotsUrl = `${parsed.origin}/robots.txt`;
    const response = await fetch(robotsUrl, {
      headers: { "User-Agent": userAgent },
      signal: AbortSignal.timeout(5000),
    });

    let allowed = true;
    if (response.ok) {
      const text = await response.text();
      allowed = parseRobotsTxt(text, parsed.pathname, userAgent);
    }

    robotsCache.set(cacheKey, { allowed, expiresAt: Date.now() + CACHE_TTL_MS });
    return allowed;
  } catch {
    return true;
  }
}
