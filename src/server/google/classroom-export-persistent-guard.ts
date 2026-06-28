import { getSupabaseAdminClient } from "../supabase/admin-client";
import { consumeCommunityRateLimit } from "../community/community-rate-limit-service";
import {
  assertClassroomExportAllowed as assertMemoryClassroomExportAllowed,
  buildClassroomExportDedupKey,
  recordClassroomExportDedup as recordMemoryClassroomExportDedup,
} from "./classroom-export-dedup";

export { buildClassroomExportDedupKey };

const DEDUP_TTL_SECONDS = 180;
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_SEC = 600;
const RATE_BUCKET_KEY = "google-classroom-export";

function isMissingRpcError(message: string): boolean {
  return /schema cache|does not exist|function.*not found|relation.*not found/i.test(
    message,
  );
}

function mapDedupRpcError(error: { message?: string; details?: string }): string {
  const detail = String(error.details || "").trim();
  if (detail) return detail;
  return String(error.message || "Exportação duplicada bloqueada.");
}

export async function assertClassroomExportAllowed(params: {
  userId: string;
  courseId: string;
  title: string;
  html: string;
}): Promise<string> {
  const dedupKey = buildClassroomExportDedupKey({
    userId: params.userId,
    courseId: params.courseId,
    title: params.title,
    html: params.html,
  });

  await consumeCommunityRateLimit({
    userId: params.userId,
    bucketKey: RATE_BUCKET_KEY,
    limit: RATE_LIMIT_MAX,
    windowSec: RATE_LIMIT_WINDOW_SEC,
  });

  const supabase = getSupabaseAdminClient();

  const { error: assertError } = await (supabase as any).rpc(
    "planify_assert_classroom_export_dedup",
    {
      p_user_id: params.userId,
      p_dedup_key: dedupKey,
      p_ttl_seconds: DEDUP_TTL_SECONDS,
    },
  );

  if (assertError) {
    if (isMissingRpcError(assertError.message)) {
      assertMemoryClassroomExportAllowed(dedupKey);
      return dedupKey;
    }

    if (/CLASSROOM_EXPORT_DEDUP/i.test(assertError.message)) {
      throw new Error(mapDedupRpcError(assertError));
    }

    throw new Error(assertError.message);
  }

  return dedupKey;
}

export async function recordClassroomExportDedup(
  userId: string,
  dedupKey: string,
): Promise<void> {
  const supabase = getSupabaseAdminClient();

  const { error } = await (supabase as any).rpc("planify_record_classroom_export_dedup", {
    p_user_id: userId,
    p_dedup_key: dedupKey,
  });

  if (error && !isMissingRpcError(error.message)) {
    console.warn("[classroom-export-dedup] record failed:", error.message);
  }

  recordMemoryClassroomExportDedup(dedupKey);
}
