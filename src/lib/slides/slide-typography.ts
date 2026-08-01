/** Minimum legible body size for classroom projection (pt). */
export const SLIDE_MIN_BODY_FONT = 22;
export const SLIDE_MAX_BODY_FONT = 28;

export const SLIDE_MIN_TITLE_FONT = 32;
export const SLIDE_MAX_TITLE_FONT = 40;

export const SLIDE_COVER_TITLE_FONT = 40;
export const SLIDE_COVER_SUBTITLE_FONT = 22;

function averageLength(items: string[]): number {
  const clean = items.filter((item) => item.trim());
  if (!clean.length) return 0;
  return clean.reduce((sum, item) => sum + item.trim().length, 0) / clean.length;
}

/** Scales slide body font by bullet density and visual elements. */
export function computeSlideBodyFontSize(input: {
  bullets: string[];
  hasImage?: boolean;
  hasCallout?: boolean;
}): number {
  const count = input.bullets.filter((item) => item.trim()).length;
  const avgLen = averageLength(input.bullets);

  let size = 28;
  if (count >= 6) size = 22;
  else if (count >= 5) size = 23;
  else if (count >= 4) size = 24;
  else if (count >= 3) size = 26;

  if (avgLen > 90) size -= 1;
  if (avgLen > 130) size -= 1;
  if (input.hasImage) size -= 1;
  if (input.hasCallout) size -= 1;

  return Math.max(SLIDE_MIN_BODY_FONT, Math.min(SLIDE_MAX_BODY_FONT, size));
}

export function computeSlideTitleFontSize(bodySize: number): number {
  return Math.min(
    SLIDE_MAX_TITLE_FONT,
    Math.max(SLIDE_MIN_TITLE_FONT, bodySize + 8),
  );
}

/** Max figure height in HTML preview (px), proportional to remaining slide space. */
export function computeSlideFigureMaxHeight(input: {
  bulletCount: number;
  hasCallout?: boolean;
}): number {
  let max = 280;
  if (input.bulletCount >= 5) max = 220;
  else if (input.bulletCount >= 4) max = 240;
  if (input.hasCallout) max -= 28;
  return Math.max(190, max);
}
