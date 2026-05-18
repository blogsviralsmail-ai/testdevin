import puppeteer from "puppeteer-core";

const CHROME_PATHS = [
  "/snap/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
];

function findChrome(): string {
  const fs = require("fs");
  for (const p of CHROME_PATHS) {
    try { if (fs.existsSync(p)) return p; } catch { /* skip */ }
  }
  return CHROME_PATHS[0];
}

// Use localhost for Puppeteer to avoid cloaker/proxy issues when fetching images
const LOCAL_BASE = `http://localhost:${process.env.PORT || 3005}`;

function resolveLocalPaths(html: string): string {
  // Convert relative src="/uploads/..." and src="/api/..." to full URLs so Puppeteer can fetch them
  return html.replace(/src="\/([^"]+)"/g, `src="${LOCAL_BASE}/$1"`);
}

export async function htmlToPdfBuffer(htmlContent: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });

  try {
    const page = await browser.newPage();

    const resolvedContent = resolveLocalPaths(htmlContent);

    const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<style>*{margin:0;padding:0;box-sizing:border-box;}@page{size:A4;margin:0;}body{font-family:'Calibri','Segoe UI',Arial,sans-serif;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}img{max-width:100%;display:inline-block;}</style>
</head><body><div class="letter-wrap">${resolvedContent}</div></body></html>`;

    await page.setContent(fullHtml, { waitUntil: "networkidle0", timeout: 30000 });
    const pdfUint8 = await page.pdf({ format: "A4", printBackground: true, margin: { top: 0, bottom: 0, left: 0, right: 0 } });
    return Buffer.from(pdfUint8);
  } finally {
    await browser.close();
  }
}
