import { stampFormFields } from "@/src/lib/pdf/stampFormFields";
import chromium from "@sparticuz/chromium";
import puppeteer, { type Browser } from "puppeteer-core";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Local dev uses the full `puppeteer` dev dependency (it ships its own
 * Chromium); production drives `@sparticuz/chromium`'s Lambda-friendly binary
 * with `puppeteer-core`. */
async function launchBrowser(): Promise<Browser> {
  if (process.env.NODE_ENV !== "production") {
    // Dev-only. Must stay a dynamic import so `puppeteer` is never bundled
    // into / required by the production function.
    // eslint-disable-next-line no-restricted-syntax
    const dev = await import("puppeteer");
    return dev.default.launch({ headless: true }) as unknown as Browser;
  }
  chromium.setGraphicsMode = false;
  return puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  });
}

/** Loads `url` in headless Chromium (forwarding the caller's cookies so the
 * page authenticates as the same coach) and returns it as a PDF, using the
 * same print path the browser's "Save as PDF" would.
 *
 * The print page seeds invisible marker tokens at every fillable-field spot;
 * `stampFormFields` turns those into interactive AcroForm fields on the way
 * out. It's a no-op (returns the bytes untouched) for any page without markers. */
export async function renderUrlToPdf(
  url: string,
  cookieHeader: string | null,
): Promise<Uint8Array> {
  let bytes: Uint8Array;
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    if (cookieHeader) {
      await page.setExtraHTTPHeaders({ cookie: cookieHeader });
    }
    await page.goto(url, { waitUntil: "networkidle0", timeout: 60_000 });
    await page.evaluateHandle("document.fonts.ready");
    // Give <doc-page> a couple of frames to measure its header/footer
    // spacers (mirrors AutoPrint's settle delay).
    await sleep(400);
    await page.emulateMediaType("print");
    bytes = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
      format: "letter",
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
  } finally {
    await browser.close();
  }
  return stampFormFields(bytes);
}
