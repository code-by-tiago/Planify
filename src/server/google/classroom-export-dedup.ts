import { createHash } from "crypto";

const DEDUP_TTL_MS = 3 * 60 * 1000;
const recentExports = new Map<string, number>();

function pruneExpired(now: number): void {
  if (recentExports.size < 50) return;

  for (const [key, ts] of recentExports) {
    if (now - ts >= DEDUP_TTL_MS) {
      recentExports.delete(key);
    }
  }
}

export function buildClassroomExportDedupKey(params: {
  userId: string;
  courseId?: string;
  targetId?: string;
  title: string;
  html: string;
}): string {
  const target = String(params.courseId || params.targetId || "classroom-share")
    .trim()
    .toLowerCase()
    .slice(0, 120);
  const contentHash = createHash("sha256")
    .update(String(params.html || "").slice(0, 12_000))
    .digest("hex")
    .slice(0, 20);

  return [
    params.userId,
    target,
    String(params.title || "").trim().toLowerCase().slice(0, 120),
    contentHash,
  ].join("|");
}

export function assertClassroomExportAllowed(dedupKey: string): void {
  const now = Date.now();
  pruneExpired(now);

  const previous = recentExports.get(dedupKey);
  if (previous && now - previous < DEDUP_TTL_MS) {
    const seconds = Math.ceil((DEDUP_TTL_MS - (now - previous)) / 1000);
    throw new Error(
      `Este material ja foi publicado para esta turma ha pouco. Aguarde ${seconds}s antes de publicar novamente.`,
    );
  }
}

export function recordClassroomExportDedup(dedupKey: string): void {
  recentExports.set(dedupKey, Date.now());
}
