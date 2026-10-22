import { renderUrlToPdf } from "@/src/lib/pdf";
import { getCoachProfile } from "@/src/services/auth.service";
import { getProgramById } from "@/src/services/program.service";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";
// A headless-Chromium render of a whole program can take a while on a cold
// function. Vercel clamps this to the plan's max (60s on Hobby).
export const maxDuration = 300;

function htmlError(status: number, message: string): Response {
  return new Response(
    `<!doctype html><meta charset="utf-8"><title>Program export</title>` +
      `<body style="font-family:system-ui,-apple-system,sans-serif;max-width:32rem;margin:4rem auto;padding:0 1rem;color:#1a1a1a">` +
      `<h1 style="font-size:1.25rem">Couldn't generate the PDF</h1><p>${message}</p></body>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const profile = await getCoachProfile();
  if (!profile.ok) {
    return htmlError(403, "You need to be signed in as a coach to do this.");
  }

  const program = await getProgramById(id);
  if (!program.ok) {
    return htmlError(404, "That program couldn't be found.");
  }

  // Chromium renders the existing /print page (it does its own auth via the
  // forwarded cookie, and owns all the layout) and we capture it as a PDF.
  const printUrl = new URL(`/print/programs/${id}`, request.nextUrl.origin);
  for (const key of ["coach", "athlete", "notes", "weeks"] as const) {
    const v = request.nextUrl.searchParams.get(key);
    if (v) printUrl.searchParams.set(key, v);
  }
  printUrl.searchParams.set("noprint", "1");

  try {
    const pdf = await renderUrlToPdf(
      printUrl.toString(),
      request.headers.get("cookie"),
    );

    // e.g. "Joe's Test Program" (id abc-123) -> "Joe-s-Test-Program-abc-123.pdf"
    const slug =
      program.data.name
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "program";
    const filename = `${slug}-${id}.pdf`;

    return new Response(pdf as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        // Private, short-lived: the client fetches this to generate it, then
        // navigates a new tab to the same URL (nonce and all) — this cache
        // entry serves that second request instantly (and with the filename
        // above). A later export uses a fresh nonce, so it never reuses a
        // stale PDF from here after the program has been edited.
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (err) {
    console.error("Program PDF export failed", err);
    return htmlError(
      500,
      "Something went wrong rendering the document. Please try again.",
    );
  }
}
