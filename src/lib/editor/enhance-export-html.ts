function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function blendOnWhite(r: number, g: number, b: number, alpha: number): string {
  return `rgb(${clampByte(r * alpha + 255 * (1 - alpha))},${clampByte(g * alpha + 255 * (1 - alpha))},${clampByte(b * alpha + 255 * (1 - alpha))})`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.replace("#", "");

  if (normalized.length !== 6) {
    return null;
  }

  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function rgbToHex(rgb: string): string | null {
  const match = rgb.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);

  if (!match) {
    return null;
  }

  const toHex = (value: string) =>
    clampByte(Number(value)).toString(16).padStart(2, "0");

  return `#${toHex(match[1])}${toHex(match[2])}${toHex(match[3])}`;
}

function firstHexColor(value: string): string | null {
  const match = value.match(/#[0-9a-fA-F]{6}/);
  return match?.[0] || null;
}

export function extractBackgroundColorFromStyle(style: string): string | null {
  const colorMatch = style.match(/background-color:\s*([^;]+)/i);
  const shorthandMatch = style.match(/background:\s*([^;]+)/i);
  const candidate = colorMatch?.[1]?.trim() || shorthandMatch?.[1]?.trim() || "";

  if (!candidate || /gradient/i.test(candidate)) {
    return null;
  }

  if (candidate.startsWith("#")) {
    return candidate.slice(0, 7);
  }

  if (candidate.startsWith("rgb")) {
    return rgbToHex(candidate);
  }

  return null;
}

export function normalizeInlineStyle(style: string): string {
  let normalized = style;

  normalized = normalized.replace(
    /background:\s*linear-gradient\([^;)]+\)/gi,
    (match) => {
      const color = firstHexColor(match);
      return color ? `background-color:${color}` : "background-color:#0f766e";
    },
  );

  normalized = normalized.replace(
    /background-image:\s*radial-gradient\([^;)]+\)/gi,
    "background-image:none",
  );

  normalized = normalized.replace(
    /background:\s*(#[0-9a-fA-F]{6})\b/gi,
    "background-color:$1",
  );

  normalized = normalized.replace(
    /background:\s*(rgb\([^)]+\))/gi,
    "background-color:$1",
  );

  normalized = normalized.replace(
    /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([0-9.]+)\s*\)/gi,
    (_, red, green, blue, alpha) =>
      blendOnWhite(Number(red), Number(green), Number(blue), Number(alpha)),
  );

  normalized = normalized.replace(
    /#([0-9a-fA-F]{6})([0-9a-fA-F]{2})\b/g,
    (_, rgb, alphaHex) => {
      const rgbParts = hexToRgb(`#${rgb}`);
      const alpha = parseInt(alphaHex, 16) / 255;

      if (!rgbParts) {
        return `#${rgb}`;
      }

      return blendOnWhite(rgbParts.r, rgbParts.g, rgbParts.b, alpha);
    },
  );

  return normalized;
}

function normalizeStyledAttributes(html: string): string {
  return html.replace(/style=(["'])([\s\S]*?)\1/gi, (_full, quote, styleContent) => {
    return `style=${quote}${normalizeInlineStyle(styleContent)}${quote}`;
  });
}

export function enhanceHtmlForExport(html: string): string {
  return normalizeStyledAttributes(String(html || ""));
}
