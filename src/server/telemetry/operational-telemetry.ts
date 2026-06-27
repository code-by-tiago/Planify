import type { Json } from "@/types/database";
import { getSupabaseAdminClient } from "../supabase/admin-client";

export type OperationalEventType =
  | "bundle_item_failed"
  | "correction_ocr_empty"
  | "question_import_zero"
  | "api_502"
  | "material_generation_failed"
  | "planning_generation_failed"
  | "export_failed"
  | "export_success"
  | "editor_ai_adjust_failed"
  | "pedagogical_cache_hit"
  | "pedagogical_cache_miss"
  | "pedagogical_inject_skipped"
  | "pedagogical_format_only"
  | "gemini_api_error";

export function logOperationalEvent(event: {
  eventType: OperationalEventType;
  toolTipo: string;
  ok: boolean;
  errorCode?: string;
  durationMs?: number;
  metadata?: Record<string, unknown>;
}): void {
  void (async () => {
    try {
      const supabase = getSupabaseAdminClient();
      await supabase.from("operational_events").insert({
        event_type: event.eventType,
        tool_tipo: event.toolTipo,
        ok: event.ok,
        error_code: event.errorCode ?? null,
        duration_ms: event.durationMs ?? null,
        metadata: (event.metadata ?? {}) as Json,
      });
    } catch {
      // telemetria não deve quebrar fluxo principal
    }
  })();
}
