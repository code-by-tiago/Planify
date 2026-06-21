import { clearOtherGoogleExportPending } from "@/lib/google/google-export-resume";

/** Sincroniza status Google entre Classroom, Slides export e editor. */
export const GOOGLE_STATUS_CHANGED_EVENT = "planify:google-status-changed";

export const GOOGLE_SLIDES_EXPORT_PENDING_KEY = "planify:google-slides-export-pending";

export type GoogleSlidesExportSlide = {
  title: string;
  bullets: string[];
  speakerNotes: string;
  layout?: string;
  subtitle?: string;
  imagePrompt?: string;
  imageUrl?: string;
  imageAlt?: string;
  sequenceStep?: number;
  sequenceLabel?: string;
  callout?: { title?: string; text?: string };
};

export type GoogleSlidesExportPending = {
  title: string;
  theme?: string;
  returnTo: string;
  /** Snapshot do deck para sobreviver ao redirecionamento OAuth. */
  html?: string;
  slides?: GoogleSlidesExportSlide[];
  ts: number;
};

export function notifyGoogleStatusChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(GOOGLE_STATUS_CHANGED_EVENT));
}

export function saveGoogleSlidesExportPending(
  payload: Omit<GoogleSlidesExportPending, "ts">,
): void {
  if (typeof window === "undefined") return;
  clearOtherGoogleExportPending(GOOGLE_SLIDES_EXPORT_PENDING_KEY);
  window.sessionStorage.setItem(
    GOOGLE_SLIDES_EXPORT_PENDING_KEY,
    JSON.stringify({ ...payload, ts: Date.now() } satisfies GoogleSlidesExportPending),
  );
}

export function readGoogleSlidesExportPending(): GoogleSlidesExportPending | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(GOOGLE_SLIDES_EXPORT_PENDING_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as GoogleSlidesExportPending;
    if (!parsed?.title || !parsed.returnTo) return null;

    // Expira em 30 minutos.
    if (Date.now() - (parsed.ts || 0) > 30 * 60 * 1000) {
      window.sessionStorage.removeItem(GOOGLE_SLIDES_EXPORT_PENDING_KEY);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function clearGoogleSlidesExportPending(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(GOOGLE_SLIDES_EXPORT_PENDING_KEY);
}
