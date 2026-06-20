// Authenticated endpoint: generates a 6-digit OTP via Supabase admin
// (no email sent by Supabase) and delivers it through Resend so the
// template and sender domain are fully under our control.
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL =
  Deno.env.get("RESEND_FROM_EMAIL") ?? "Hooper <noreply@mail.hooper.app>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json(401, { ok: false, error: "Unauthorized" });
  }
  const callerToken = authHeader.slice(7);

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const {
    data: { user },
    error: userError,
  } = await admin.auth.getUser(callerToken);

  if (userError || !user?.email) {
    return json(401, { ok: false, error: "Unauthorized" });
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("has_real_email")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!profile?.has_real_email) {
    return json(403, {
      ok: false,
      error: "Password changes for this account are managed by a guardian.",
    });
  }

  // Generate the OTP token without triggering any Supabase-sent email.
  const { data: linkData, error: linkError } =
    await admin.auth.admin.generateLink({
      type: "magiclink",
      email: user.email,
    });

  if (linkError || !linkData?.properties?.email_otp) {
    return json(500, {
      ok: false,
      error: "Failed to generate verification code.",
    });
  }

  const otp = linkData.properties.email_otp;

  const emailRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: user.email,
      subject: "Your Hooper security code",
      html: securityCodeHtml(otp, user.email),
    }),
  });

  if (!emailRes.ok) {
    if (emailRes.status === 429) {
      return json(429, {
        ok: false,
        error: "Too many requests. Please wait before trying again.",
      });
    }
    return json(500, { ok: false, error: "Failed to send verification code." });
  }

  const maskedEmail = user.email.replace(
    /(.{2})(.*)(@.*)/,
    (_m: string, a: string, _b: string, c: string) => `${a}···${c}`,
  );

  return json(200, { ok: true, maskedEmail });
});

function securityCodeHtml(otp: string, email: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Hooper security code</title>
  <style>
    body { margin: 0; padding: 0; background-color: #1F1B1C; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
    a { color: #F15825; }
    @media only screen and (max-width: 600px) { .email-container { width: 100% !important; } }
  </style>
</head>
<body>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#1F1B1C;">
    <tr><td align="center" style="padding:40px 16px;">
      <table class="email-container" role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="background-color:#FAF7F4;border-radius:16px;overflow:hidden;">
        <tr><td style="background-color:#231F20;padding:28px 32px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
            <td style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">Hooper</td>
            <td align="right" style="font-size:10px;font-weight:600;letter-spacing:1.8px;text-transform:uppercase;color:#F15825;">Account &middot; Security</td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:40px 36px 0 36px;">
          <p style="margin:0 0 12px 0;font-size:11px;font-weight:600;letter-spacing:1.98px;text-transform:uppercase;color:#F15825;">Identity verification</p>
          <h1 style="margin:0 0 14px 0;font-size:28px;font-weight:800;letter-spacing:-0.56px;line-height:1.15;color:#231F20;">Your security code.</h1>
          <p style="margin:0;font-size:15px;line-height:1.6;color:#5A5152;">Enter this 6-digit code in the Hooper app to verify your identity before changing your password.</p>
        </td></tr>
        <tr><td style="padding:24px 36px 28px 36px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#FFFFFF;border:1px solid #E7E1DA;border-radius:16px;">
            <tr><td align="center" style="padding:28px 24px 24px 24px;">
              <p style="margin:0 0 14px 0;font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#8A8082;">Your security code</p>
              <p style="margin:0 0 14px 0;font-size:36px;font-weight:700;letter-spacing:10px;color:#F15825;font-family:monospace;">${otp}</p>
              <p style="margin:0;font-size:12px;color:#8A8082;">Expires in 15 minutes</p>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:0 36px 28px 36px;">
          <p style="margin:0;font-size:15px;line-height:1.6;color:#5A5152;">Didn't request this? You can safely ignore this email &mdash; your password won't change unless you enter the code above.</p>
        </td></tr>
        <tr><td style="background-color:#F2EEE8;border-top:1px solid #E7E1DA;padding:22px 36px 26px 36px;">
          <p style="margin:0;font-size:11px;line-height:1.7;color:#8A8082;">Hooper Performance Ltd &middot; Sent to ${email} to keep your account secure.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
