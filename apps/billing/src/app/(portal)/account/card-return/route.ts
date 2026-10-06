import { completeSetupIntent } from "@/src/services/billing.service";
import { NextResponse, type NextRequest } from "next/server";

/** Stripe's return_url for a card update that needed a redirect (3DS). The
 * client-side setDefaultCardAction never ran, so make the new card the
 * default here, then land on /account with Stripe's params stripped. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const setupIntent = params.get("setup_intent");
  const url = request.nextUrl.clone();
  url.search = "";
  url.pathname = "/account";

  let saved = false;
  if (setupIntent && params.get("redirect_status") === "succeeded") {
    saved = (await completeSetupIntent(setupIntent)).ok;
  }
  url.searchParams.set("card", saved ? "updated" : "failed");
  return NextResponse.redirect(url);
}
