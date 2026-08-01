/** Detecta HTML gerado pelo motor de slides do Planify. */
export function isSlideDeckHtml(html: string): boolean {
  if (!html?.trim()) return false;
  return (
    /class=["'][^"']*planify-slide/i.test(html) ||
    /data-planify-slide-theme=/i.test(html) ||
    /<h2[^>]*>Apresentação\s*·/i.test(html)
  );
}

/** Lê o tema de design embutido no HTML exportado. */
export function extractSlideThemeFromHtml(html: string): string | null {
  const match = html.match(/data-planify-slide-theme=["']([a-z]+)["']/i);
  return match?.[1]?.toLowerCase() ?? null;
}
