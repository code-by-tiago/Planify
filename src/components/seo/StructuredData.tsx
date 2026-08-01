import { SEO } from "@/lib/seo/constants";
import { getSiteUrl } from "@/lib/seo/site-url";

export function StructuredData() {
  const siteUrl = getSiteUrl();
  const logoUrl = `${siteUrl}${SEO.logoPath}`;

  const graph = [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: SEO.brand,
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: logoUrl,
      },
      description: SEO.descriptionFull,
      ...(SEO.sameAs.length > 0 ? { sameAs: SEO.sameAs } : {}),
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name: SEO.brand,
      url: siteUrl,
      publisher: { "@id": `${siteUrl}/#organization` },
      inLanguage: "pt-BR",
      description: SEO.descriptionShort,
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${siteUrl}/#software`,
      name: SEO.visualName,
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      url: siteUrl,
      description: SEO.descriptionFull,
      offers: {
        "@type": "Offer",
        url: `${siteUrl}/planos`,
        priceCurrency: "BRL",
        availability: "https://schema.org/InStock",
      },
      publisher: { "@id": `${siteUrl}/#organization` },
    },
  ];

  const payload = {
    "@context": "https://schema.org",
    "@graph": graph,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
