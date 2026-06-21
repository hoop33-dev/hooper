// Public endpoint (verify_jwt = false): notifies an existing account owner
// when a sign-up is attempted with their email. Returns 200 regardless to
// prevent email enumeration. Only sends if the email belongs to a real account.

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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let email: string | undefined;
  try {
    const body = await req.json();
    email = typeof body?.email === "string" ? body.email.trim() : undefined;
  } catch {
    // malformed body — treat as no-op
  }

  if (!email) {
    return json(200, { ok: true });
  }

  // Check if this email belongs to a real account before sending.
  // Uses GoTrue's admin users list with an email query so we never reveal
  // existence in the response — we just silently skip if not found.
  const usersRes = await fetch(
    `${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=1&query=${encodeURIComponent(email)}`,
    {
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: SUPABASE_SERVICE_ROLE_KEY,
      },
    },
  );

  if (usersRes.ok) {
    const { users } = await usersRes.json();
    const exists =
      Array.isArray(users) &&
      users.some((u: { email: string }) => u.email === email);

    if (exists) {
      // Fire-and-forget — we don't await or check the result so the response
      // time doesn't leak whether the send succeeded. We do attach a
      // non-blocking handler purely to log Resend failures (e.g. an
      // unverified sender domain), which would otherwise vanish silently.
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: email,
          subject: "You already have a Hooper account",
          html: accountExistsHtml(email),
        }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const body = await res.text().catch(() => "");
            console.error(
              `send-account-exists-email: Resend returned ${res.status}`,
              body,
            );
          }
        })
        .catch((err) => {
          console.error("send-account-exists-email: send failed", err);
        });
    }
  }

  return json(200, { ok: true });
});

function accountExistsHtml(email: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You already have a Hooper account</title>
  <style>
    body { margin: 0; padding: 0; background-color: #1F1B1C; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
    a { color: #F15825; }
    .button-link { display:inline-block;background-color:#F15825;color:#ffffff!important;font-size:15px;font-weight:700;text-decoration:none!important;border-radius:9999px;padding:16px 28px; }
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
            <td align="right" style="font-size:10px;font-weight:600;letter-spacing:1.8px;text-transform:uppercase;color:#F15825;">Account</td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:40px 36px 0 36px;">
          <p style="margin:0 0 12px 0;font-size:11px;font-weight:600;letter-spacing:1.98px;text-transform:uppercase;color:#F15825;">Sign-up attempt</p>
          <h1 style="margin:0 0 14px 0;font-size:28px;font-weight:800;letter-spacing:-0.56px;line-height:1.15;color:#231F20;">You already have an account.</h1>
          <p style="margin:0;font-size:15px;line-height:1.6;color:#5A5152;">Someone tried to create a new Hooper account using <strong style="color:#231F20;">${email}</strong>. That email is already connected to an existing account &mdash; that's you!</p>
        </td></tr>
        <tr><td style="padding:24px 36px 8px 36px;text-align:center;">
          <a href="hooper://login" class="button-link">Sign in to Hooper</a>
        </td></tr>
        <tr><td style="padding:16px 36px 28px 36px;">
          <p style="margin:0;font-size:15px;line-height:1.6;color:#5A5152;">Forgot your password? You can reset it from the sign-in screen. If this wasn't you, you can safely ignore this email.</p>
        </td></tr>
        <tr><td style="background-color:#F2EEE8;border-top:1px solid #E7E1DA;padding:22px 36px 26px 36px;">
          <p style="margin:0;font-size:11px;line-height:1.7;color:#8A8082;">Hooper Performance Ltd &middot; Sent to ${email} because someone attempted to register with this address.</p>
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
