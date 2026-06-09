/**
 * Google Slides / PowerPoint 16:9 widescreen (10" × 5.625" / 720×405pt).
 * Must match `LAYOUT_16x9` in pptxgenjs and the HTML preview canvas (720×405px).
 */
export const SLIDE_WIDTH_IN = 10;
export const SLIDE_HEIGHT_IN = 5.625;
export const SLIDE_MARGIN_X = 0.45;
export const SLIDE_MARGIN_BOTTOM = 0.32;
export const SLIDE_CONTENT_W = SLIDE_WIDTH_IN - SLIDE_MARGIN_X * 2;
export const SLIDE_CONTENT_BOTTOM = SLIDE_HEIGHT_IN - SLIDE_MARGIN_BOTTOM;
export const SLIDE_LAYOUT = "LAYOUT_16x9";

/** HTML/PDF design canvas — 1px ≈ 1pt at 72dpi on a 10" slide. */
export const SLIDE_DESIGN_WIDTH_PX = 720;
export const SLIDE_DESIGN_HEIGHT_PX = 405;

export const SLIDE_EXPORT_PAGE_WIDTH_MM = 254;
export const SLIDE_EXPORT_PAGE_HEIGHT_MM = 142.875;

/** Scale 720px design canvas to print page width at 96dpi. */
export const SLIDE_EXPORT_INNER_SCALE =
  (SLIDE_EXPORT_PAGE_WIDTH_MM / 25.4) * 96 / SLIDE_DESIGN_WIDTH_PX;

/** Height reserved for bullet list block (inches). */
export function computeBulletBlockHeight(bulletCount: number): number {
  if (bulletCount <= 0) return 0;
  const lineHeight = 0.36;
  const maxHeight = SLIDE_CONTENT_BOTTOM - 1.52;
  return Math.min(maxHeight, lineHeight * bulletCount + 0.28);
}

/** Image area height after text blocks (inches). */
export function computeSlideImageHeight(contentBottomY: number): number {
  const remaining = SLIDE_CONTENT_BOTTOM - contentBottomY;
  return Math.max(1.65, Math.min(remaining, 3.4));
}
