/**
 * Renderiza Pacote Social Light — 30 posts + capas Reel.
 * Uso: node scripts/render-social-pack.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import puppeteer from "puppeteer-core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const TPL = path.join(ROOT, "marketing", "templates");
const OUT_POSTS = path.join(ROOT, "marketing", "output", "posts");
const OUT_CAPS = path.join(ROOT, "marketing", "output", "caps");
const CONTENT = path.join(ROOT, "marketing", "content", "content-pack.json");

const SCALE = 2;
const FEED = { width: 1080, height: 1350 };
const SQUARE = { width: 1080, height: 1080 };

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

async function loadTemplate(page, htmlFile) {
  const url = pathToFileURL(path.join(TPL, htmlFile)).href;
  await page.goto(url, { waitUntil: "networkidle0", timeout: 45_000 });
  await page.evaluateHandle("document.fonts.ready");
  await new Promise((r) => setTimeout(r, 400));
}

async function screenshotFrame(page, selector, outPath, { width, height }) {
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await page.setViewport({ width, height, deviceScaleFactor: SCALE });
  const el = await page.$(selector);
  if (!el) throw new Error(`Elemento não encontrado: ${selector}`);
  const box = await el.boundingBox();
  if (!box) throw new Error(`Bounding box vazio: ${selector}`);
  const w = Math.round(box.width);
  const h = Math.round(box.height);
  if (w !== width || h !== height) {
    throw new Error(`${outPath}: esperado ${width}×${height}, obtido ${w}×${h}`);
  }
  await page.screenshot({
    path: outPath,
    type: "png",
    clip: { x: box.x, y: box.y, width, height },
  });
  const pxW = width * SCALE;
  const pxH = height * SCALE;
  console.log(`✓ ${path.relative(ROOT, outPath)} (${pxW}×${pxH} @${SCALE}x)`);
}

async function renderFeedPost(page, data, outPath) {
  await loadTemplate(page, "post-feed-4x5.html");
  await page.evaluate((d) => window.setPostData(d), data);
  await new Promise((r) => setTimeout(r, 200));
  await screenshotFrame(page, "#frame", outPath, FEED);
}

async function renderSquareCap(page, data, outPath) {
  await loadTemplate(page, "post-square-1x1.html");
  await page.evaluate((d) => window.setPostData(d), data);
  await new Promise((r) => setTimeout(r, 200));
  await screenshotFrame(page, "#frame", outPath, SQUARE);
}

async function main() {
  const chrome = resolveChrome();
  if (!chrome) {
    console.error("Chrome não encontrado. Defina CHROME_EXECUTABLE_PATH.");
    process.exit(1);
  }

  const pack = JSON.parse(await fs.readFile(CONTENT, "utf8"));
  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--font-render-hinting=none"],
  });

  const generated = [];

  try {
    const page = await browser.newPage();

    for (const carousel of pack.carousels) {
      for (let i = 0; i < carousel.slides.length; i++) {
        const slide = carousel.slides[i];
        const num = String(i + 1).padStart(2, "0");
        const outPath = path.join(
          OUT_POSTS,
          `${carousel.id}-${carousel.name}-slide-${num}-1080x1350.png`,
        );
        await renderFeedPost(page, slide, outPath);
        generated.push(outPath);
      }
    }

    for (const post of pack.posts) {
      const outPath = path.join(OUT_POSTS, `${post.id}-${post.name}-1080x1350.png`);
      await renderFeedPost(page, post, outPath);
      generated.push(outPath);
    }

    for (const cap of pack.caps) {
      const outPath = path.join(OUT_CAPS, `${cap.id}-reel-cap-1080x1080.png`);
      await renderSquareCap(page, cap, outPath);
      generated.push(outPath);
    }

    console.log(`\n${generated.length} arquivos em marketing/output/`);
    console.log(`Posts: ${pack.carousels.length * 5 + pack.posts.length} PNGs (4:5)`);
    console.log(`Capas: ${pack.caps.length} PNGs (1:1)`);
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
