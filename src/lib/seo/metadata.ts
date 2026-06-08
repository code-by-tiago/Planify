import type { Metadata } from "next";
import { DEFAULT_TITLE, SEO, TITLE_TEMPLATE } from "./constants";
import { getSiteUrl } from "./site-url";

type PageMetadataOptions = {
  title: string;
  description?: string;
  path: string;
  noIndex?: boolean;
};

export function buildGlobalMetadata(): Metadata {
  const siteUrl = getSiteUrl();

  return {
    metadataBase: new URL(siteUrl),
    applicationName: SEO.brand,
    creator: SEO.creator,
    publisher: SEO.publisher,
    title: {
      default: DEFAULT_TITLE,
      template: TITLE_TEMPLATE,
    },
    description: SEO.descriptionFull,
    keywords: [...SEO.keywords],
    alternates: {
      canonical: siteUrl,
    },
    openGraph: {
      type: "website",
      locale: SEO.locale,
      url: siteUrl,
      siteName: SEO.brand,
      title: DEFAULT_TITLE,
      description: SEO.descriptionFull,
    },
    twitter: {
      card: "summary_large_image",
      title: DEFAULT_TITLE,
      description: SEO.descriptionShort,
    },
    robots: {
      index: true,
      follow: true,
    },
    verification: {
      google: "MvgDB8L5EBhazEZWiIHAGPz5qUWn6Hk06ssd0zoPJIA",
    },
  };
}

export function buildPageMetadata({
  title,
  description,
  path,
  noIndex = false,
}: PageMetadataOptions): Metadata {
  const siteUrl = getSiteUrl();
  const canonical = `${siteUrl}${path}`;
  const desc = description ?? SEO.descriptionFull;
  const ogTitle = `${title} | ${SEO.brand}`;

  return {
    title,
    description: desc,
    alternates: {
      canonical,
    },
    openGraph: {
      title: ogTitle,
      description: desc,
      url: canonical,
      siteName: SEO.brand,
      locale: SEO.locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: desc,
    },
    ...(noIndex
      ? {
          robots: {
            index: false,
            follow: false,
          },
        }
      : {}),
  };
}

export const PRIVATE_ROBOTS: Metadata["robots"] = {
  index: false,
  follow: false,
};
