/** Tamanho mínimo legível em projeção (px/pt). */
export const SLIDE_MIN_BODY_FONT = 20;
export const SLIDE_MAX_BODY_FONT = 28;

function averageLength(items: string[]): number {
  const clean = items.filter((item) => item.trim());
  if (!clean.length) return 0;
  return clean.reduce((sum, item) => sum + item.trim().length, 0) / clean.length;
}

/** Escala o corpo do slide conforme densidade de texto e elementos visuais. */
export function computeSlideBodyFontSize(input: {
  bullets: string[];
  hasImage?: boolean;
  hasCallout?: boolean;
}): number {
  const count = input.bullets.filter((item) => item.trim()).length;
  const avgLen = averageLength(input.bullets);

  let size = 26;
  if (count >= 6) size = 20;
  else if (count >= 5) size = 21;
  else if (count >= 4) size = 22;
  else if (count >= 3) size = 24;

  if (avgLen > 90) size -= 1;
  if (avgLen > 130) size -= 1;
  if (input.hasImage) size -= 1;
  if (input.hasCallout) size -= 1;

  const result = Math.max(SLIDE_MIN_BODY_FONT, Math.min(SLIDE_MAX_BODY_FONT, size));
  // #region agent log
  if (typeof fetch !== "undefined") {
    fetch("http://127.0.0.1:7616/ingest/e1530077-9aac-4460-b700-4c831c23c281", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "1b39d8",
      },
      body: JSON.stringify({
        sessionId: "1b39d8",
        runId: "runtime",
        hypothesisId: "H1",
        location: "slide-typography.ts:computeSlideBodyFontSize",
        message: "body font computed",
        data: {
          bulletCount: count,
          avgLen: Math.round(avgLen),
          hasImage: Boolean(input.hasImage),
          hasCallout: Boolean(input.hasCallout),
          result,
          minOk: result >= SLIDE_MIN_BODY_FONT,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  }
  // #endregion
  return result;
}

export function computeSlideTitleFontSize(bodySize: number): number {
  return Math.min(32, Math.max(24, bodySize + 3));
}

/** Altura máxima da figura no preview HTML (px), proporcional ao espaço restante. */
export function computeSlideFigureMaxHeight(input: {
  bulletCount: number;
  hasCallout?: boolean;
}): number {
  let max = 240;
  if (input.bulletCount >= 5) max = 200;
  if (input.bulletCount >= 4) max = 210;
  if (input.hasCallout) max -= 24;
  return Math.max(160, max);
}
