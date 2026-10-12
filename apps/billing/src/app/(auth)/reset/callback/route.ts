import { exchangeRecoveryCode } from "@/src/services/auth.service";
import { NextResponse, type NextRequest } from "next/server";

/** Landing point for the password-recovery email link. Exchanges the PKCE
 * code for a session (cookies can only be written in a route handler, not a
 * page render), then shows the new-password form. */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const url = request.nextUrl.clone();
  url.search = "";
  url.pathname = "/reset/confirm";

  if (!code) {
    url.searchParams.set("error", "missing");
    return NextResponse.redirect(url);
  }
  const res = await exchangeRecoveryCode(code);
  if (!res.ok) url.searchParams.set("error", "expired");
  return NextResponse.redirect(url);
}
