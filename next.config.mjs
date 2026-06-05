/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    "@google/genai",
    "@sparticuz/chromium-min",
    "puppeteer-core",
    "linkedom",
  ],
};

export default nextConfig;
