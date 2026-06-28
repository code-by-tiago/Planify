const DEBUG_ENDPOINT =
  "http://127.0.0.1:7718/ingest/9ac33552-969d-48be-9089-3a3b10571400";
const DEBUG_SESSION = "5b9381";

export function agentDebugLog(payload: {
  hypothesisId: string;
  location: string;
  message: string;
  data?: Record<string, unknown>;
  runId?: string;
}): void {
  if (typeof window === "undefined" || process.env.NODE_ENV === "production") return;

  fetch(DEBUG_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": DEBUG_SESSION,
    },
    body: JSON.stringify({
      sessionId: DEBUG_SESSION,
      timestamp: Date.now(),
      ...payload,
    }),
  }).catch(() => {});
}
