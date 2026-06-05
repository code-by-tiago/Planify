import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo/site-url";

const publicPages: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/planos", changeFrequency: "weekly", priority: 0.9 },
  { path: "/contato", changeFrequency: "monthly", priority: 0.6 },
  { path: "/privacidade", changeFrequency: "yearly", priority: 0.3 },
  { path: "/termos", changeFrequency: "yearly", priority: 0.3 },
  { path: "/login", changeFrequency: "monthly", priority: 0.4 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();
  const lastModified = new Date();

  return publicPages.map((page) => ({
    url: `${baseUrl}${page.path}`,
    lastModified,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
