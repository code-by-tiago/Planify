import { withSentryConfig } from "@sentry/nextjs";

const sentryDsn =
  process.env.SENTRY_DSN?.trim() ||
  process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    "@google/genai",
    "@sparticuz/chromium-min",
    "puppeteer-core",
    "linkedom",
    "pdfkit",
  ],
  async headers() {
    return [
      {
        source: "/dashboard",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-cache, no-store, max-age=0, must-revalidate",
          },
        ],
      },
      {
        source: "/dashboard/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-cache, no-store, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default sentryDsn
  ? withSentryConfig(nextConfig, {
      silent: true,
      disableServerWebpackPlugin: true,
      disableClientWebpackPlugin: true,
    })
  : nextConfig;
