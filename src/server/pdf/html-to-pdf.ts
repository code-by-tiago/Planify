import chromium from "@sparticuz/chromium-min";
import puppeteer from "puppeteer-core";

const CHROMIUM_PACK_URL =
  process.env.CHROMIUM_PACK_URL ||
  "https://github.com/Sparticuz/chromium/releases/download/v149.0.0/chromium-v149.0.0-pack.x64.tar";

const PDF_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-gpu",
  "--single-process",
];

function resolveLocalChromeExecutable(): string | null {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    process.env.CHROME_EXECUTABLE_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ].filter(Boolean) as string[];

  return candidates[0] || null;
}

async function launchBrowser() {
  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    const executablePath = resolveLocalChromeExecutable();

    if (!executablePath) {
      throw new Error(
        "Chrome/Chromium não encontrado para gerar PDF em desenvolvimento.",
      );
    }

    return puppeteer.launch({
      executablePath,
      headless: true,
      args: PDF_ARGS,
    });
  }

  const executablePath = await chromium.executablePath(CHROMIUM_PACK_URL);
  const args = await puppeteer.defaultArgs({
    args: [...chromium.args, ...PDF_ARGS],
    headless: "shell",
  });

  return puppeteer.launch({
    args,
    executablePath,
    headless: "shell",
  });
}

export type PdfRenderProfile = "document" | "slides";

<<<<<<< HEAD
const SLIDE_PAGE = { width: "338mm", height: "190mm" } as const;
const DOCUMENT_PAGE = { format: "A4" as const };

export async function renderHtmlToPdfBuffer(
  html: string,
  profile: PdfRenderProfile = "document",
=======
export type PdfRenderOptions = {
  /** Rodapé HTML renderizado em cada página via displayHeaderFooter do Puppeteer. */
  footerHtml?: string;
};

const SLIDE_PAGE = { width: "338mm", height: "190mm" } as const;
const DOCUMENT_PAGE = { format: "A4" as const };

function escapeFooterText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildPdfFooterTemplate(text: string): string {
  return `<div style="width:100%;font-size:8px;color:#94a3b8;text-align:center;padding:0 12mm 4mm;font-family:Segoe UI,system-ui,sans-serif;border-top:1px solid #e2e8f0;margin:0 12mm;padding-top:3mm;box-sizing:border-box;">${escapeFooterText(text)}</div>`;
}

export async function renderHtmlToPdfBuffer(
  html: string,
  profile: PdfRenderProfile = "document",
  options?: PdfRenderOptions,
>>>>>>> origin/aplicar-melhorias-na-producao
): Promise<Buffer> {
  const browser = await launchBrowser();

  try {
    const page = await browser.newPage();
    await page.emulateMediaType("print");
    await page.setContent(html, {
      waitUntil: "load",
      timeout: 45_000,
    });

    await page.evaluate(async () => {
      const images = Array.from(document.images);

      await Promise.all(
        images.map((image) => {
          if (image.complete) {
            return Promise.resolve();
          }

          return new Promise<void>((resolve) => {
            image.addEventListener("load", () => resolve(), { once: true });
            image.addEventListener("error", () => resolve(), { once: true });
          });
        }),
      );
    });

<<<<<<< HEAD
    const slideCount =
      profile === "slides"
        ? await page.evaluate(
            () => document.querySelectorAll(".planify-slide").length,
          )
        : 0;
=======
    const hasFooter = Boolean(options?.footerHtml?.trim()) && profile === "document";
>>>>>>> origin/aplicar-melhorias-na-producao

    const pdfOptions =
      profile === "slides"
        ? {
            width: SLIDE_PAGE.width,
            height: SLIDE_PAGE.height,
            printBackground: true,
            preferCSSPageSize: true,
            margin: { top: 0, right: 0, bottom: 0, left: 0 },
          }
        : {
            format: DOCUMENT_PAGE.format,
            printBackground: true,
<<<<<<< HEAD
            preferCSSPageSize: true,
            margin: {
              top: "12mm",
              right: "12mm",
              bottom: "12mm",
              left: "12mm",
            },
=======
            preferCSSPageSize: !hasFooter,
            margin: {
              top: "12mm",
              right: "12mm",
              bottom: hasFooter ? "18mm" : "12mm",
              left: "12mm",
            },
            ...(hasFooter
              ? {
                  displayHeaderFooter: true,
                  headerTemplate: "<span></span>",
                  footerTemplate: options!.footerHtml!,
                }
              : {}),
>>>>>>> origin/aplicar-melhorias-na-producao
          };

    const pdf = await page.pdf(pdfOptions);

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
