import { consumeCommunityRateLimit } from "@/server/community/community-rate-limit-service";

const TRANSCRIBE_LIMIT = 20;
const INTERPRET_LIMIT = 30;
const WINDOW_SEC = 60 * 60;

export async function consumeCopilotoTranscribeRateLimit(
  userId: string,
): Promise<void> {
  await consumeCommunityRateLimit({
    userId,
    bucketKey: "copiloto:transcrever",
    limit: TRANSCRIBE_LIMIT,
    windowSec: WINDOW_SEC,
  });
}

export async function consumeCopilotoInterpretRateLimit(
  userId: string,
): Promise<void> {
  await consumeCommunityRateLimit({
    userId,
    bucketKey: "copiloto:interpretar",
    limit: INTERPRET_LIMIT,
    windowSec: WINDOW_SEC,
  });
}
