/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    "@sparticuz/chromium-min",
    "puppeteer-core",
    "linkedom",
  ],
};

export default nextConfig;
