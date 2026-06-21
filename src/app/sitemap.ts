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

  return entries;
}
