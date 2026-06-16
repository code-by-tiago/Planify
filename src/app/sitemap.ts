import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo/site-url";
import { PUBLIC_SITEMAP_PAGES } from "@/lib/seo/public-paths";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();
  const lastModified = new Date();

  const entries = PUBLIC_SITEMAP_PAGES.map((page) => ({
    url: `${baseUrl}${page.path}`,
    lastModified,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  // #region agent log
  fetch("http://127.0.0.1:7616/ingest/e1530077-9aac-4460-b700-4c831c23c281", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "4ba21b",
    },
    body: JSON.stringify({
      sessionId: "4ba21b",
      runId: "audit-system-health",
      hypothesisId: "C",
      location: "sitemap.ts:sitemap",
      message: "Sitemap generated",
      data: { baseUrl, entryCount: entries.length },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  return entries;
}
