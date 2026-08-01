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
<<<<<<< HEAD
=======
  const ogImage = {
    url: `${siteUrl}${SEO.ogImagePath}`,
    width: SEO.ogImageWidth,
    height: SEO.ogImageHeight,
    alt: SEO.brand,
  };
>>>>>>> origin/aplicar-melhorias-na-producao

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
<<<<<<< HEAD
=======
      images: [ogImage],
>>>>>>> origin/aplicar-melhorias-na-producao
    },
    twitter: {
      card: "summary_large_image",
      title: DEFAULT_TITLE,
      description: SEO.descriptionShort,
<<<<<<< HEAD
=======
      images: [ogImage.url],
>>>>>>> origin/aplicar-melhorias-na-producao
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
<<<<<<< HEAD
=======
  const ogImage = {
    url: `${siteUrl}${SEO.ogImagePath}`,
    width: SEO.ogImageWidth,
    height: SEO.ogImageHeight,
    alt: SEO.brand,
  };
>>>>>>> origin/aplicar-melhorias-na-producao

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
<<<<<<< HEAD
=======
      images: [ogImage],
>>>>>>> origin/aplicar-melhorias-na-producao
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: desc,
<<<<<<< HEAD
=======
      images: [ogImage.url],
>>>>>>> origin/aplicar-melhorias-na-producao
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
