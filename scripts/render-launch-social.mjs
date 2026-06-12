/**
 * Renderiza criativos de lançamento Planify em PNG (dimensões oficiais).
 * Uso: node scripts/render-launch-social.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import puppeteer from "puppeteer-core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const HTML_DIR = path.join(ROOT, "marketing", "instagram", "html");
const OUT = path.join(ROOT, "marketing", "instagram", "launch");

function resolveChrome() {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    process.env.CHROME_EXECUTABLE_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "/usr/bin/google-chrome",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ].filter(Boolean);
  return candidates[0] || null;
}

async function loadHtmlPage(page, htmlFile) {
  const fileUrl = pathToFileURL(path.join(HTML_DIR, htmlFile)).href;
  await page.goto(fileUrl, { waitUntil: "networkidle0", timeout: 45_000 });
  await page.evaluateHandle("document.fonts.ready");
  await new Promise((resolve) => setTimeout(resolve, 400));
}

async function screenshotElement(page, selector, outPath, { width, height }) {
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  const el = await page.$(selector);
  if (!el) throw new Error(`Elemento não encontrado: ${selector}`);
  await el.screenshot({ path: outPath, type: "png" });
  console.log(`✓ ${path.relative(ROOT, outPath)} (${width}×${height})`);
}

async function main() {
  const chrome = resolveChrome();
  if (!chrome) {
    console.error("Chrome não encontrado. Defina CHROME_EXECUTABLE_PATH.");
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--font-render-hinting=none"],
  });

  try {
    const page = await browser.newPage();

    await loadHtmlPage(page, "launch-carrossel.html");
    for (let i = 1; i <= 5; i++) {
      await screenshotElement(
        page,
        `#slide-${i}`,
        path.join(OUT, "carrossel-lancamento", `slide-${i}-1080x1080.png`),
        { width: 1080, height: 1080 },
      );
    }

    await loadHtmlPage(page, "launch-reel.html");
    await screenshotElement(
      page,
      "#reel-cover",
      path.join(OUT, "reel-lancamento", "reel-cover-1080x1920.png"),
      { width: 1080, height: 1920 },
    );

    await loadHtmlPage(page, "launch-feed-portrait.html");
    await screenshotElement(
      page,
      "#portrait-feed",
      path.join(OUT, "feed-portrait", "post-portrait-1080x1350.png"),
      { width: 1080, height: 1350 },
    );

    await loadHtmlPage(page, "launch-facebook.html");
    await screenshotElement(
      page,
      "#facebook-post",
      path.join(OUT, "facebook", "post-link-1200x630.png"),
      { width: 1200, height: 630 },
    );

    await loadHtmlPage(page, "launch-whatsapp-status.html");
    for (let i = 1; i <= 3; i++) {
      await screenshotElement(
        page,
        `#wa-status-${i}`,
        path.join(OUT, "whatsapp-status", `status-${i}-1080x1920.png`),
        { width: 1080, height: 1920 },
      );
    }

    console.log("\nDimensões geradas:");
    console.log("- Instagram/Facebook carrossel & feed quadrado: 1080×1080");
    console.log("- Instagram feed retrato (4:5): 1080×1350");
    console.log("- Instagram Reels / Stories / Facebook Reels: 1080×1920");
    console.log("- Facebook post link: 1200×630");
    console.log("- WhatsApp Status: 1080×1920 (3 telas)");
    console.log(`\nPasta: ${path.relative(ROOT, OUT)}`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
