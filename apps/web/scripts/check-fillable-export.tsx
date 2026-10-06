/**
 * Dev-only end-to-end check for the program-export PDF's fillable form fields.
 * Renders the synthetic program (shared with preview-program-export.tsx) through
 * headless Chromium exactly as the export route does, stamps the AcroForm
 * fields, and asserts every marker became a field. Optionally writes the PDF
 * and page PNGs to a directory for eyeballing.
 *
 *   npx tsx --tsconfig scripts/tsconfig.json scripts/check-fillable-export.tsx [outDir]
 */
import { writeFileSync } from "fs";
import { PDFDocument } from "pdf-lib";
import puppeteer from "puppeteer";
import { extractTokenHits } from "../src/lib/pdf/extractTokenPositions";
import { stampFormFields } from "../src/lib/pdf/stampFormFields";
import { renderProgramExportHtml } from "../src/lib/renderProgramExportHtml";
import { program, styles } from "./preview-program-export";

const outDir = process.argv[2];

function expectedFieldCount(): number {
  let n = 0;
  for (const s of program.sessions) {
    n += 1; // one Date field per session
    for (const b of s.blocks) for (const be of b.exercises) n += be.sets; // one Logged field per set row
  }
  return n;
}

async function main() {
  const html = renderProgramExportHtml({
    program,
    styles,
    coach: "Marcus Davis",
    athlete: "Jordan Lee",
    notes: program.notes ?? "",
    weeks: Array.from({ length: program.weeks }, (_, i) => i + 1),
  });

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "load", timeout: 60_000 });
  await page.evaluateHandle("document.fonts.ready");
  await new Promise((r) => setTimeout(r, 400));
  await page.emulateMediaType("print");
  const rendered = new Uint8Array(
    await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
      format: "letter",
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    }),
  );
  await browser.close();

  const hits = await extractTokenHits(rendered);
  const stamped = await stampFormFields(rendered);
  const fields = (await PDFDocument.load(stamped)).getForm().getFields();

  const expected = expectedFieldCount();
  const names = new Set(fields.map((f) => f.getName()));
  const dates = [...names].filter((n) => n.startsWith("date_")).length;
  const logs = [...names].filter((n) => n.startsWith("log_")).length;

  console.log(`marker hits:        ${hits.length}`);
  console.log(
    `stamped fields:     ${fields.length}  (${dates} date, ${logs} log)`,
  );
  console.log(`expected fields:    ${expected}`);
  console.log(
    `size:               ${rendered.length} -> ${stamped.length} bytes`,
  );

  if (outDir) {
    writeFileSync(`${outDir}/fillable-export.pdf`, stamped);
    console.log(`wrote ${outDir}/fillable-export.pdf`);
  }

  if (fields.length !== expected || fields.length !== names.size) {
    console.error("FAIL: field count mismatch or duplicate names");
    process.exit(1);
  }
  console.log("OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
