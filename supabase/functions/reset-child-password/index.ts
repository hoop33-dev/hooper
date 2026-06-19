// Deploy: supabase functions deploy reset-child-password
//
// Requires a valid JWT (parent must be authenticated). Uses the service-role
// client to update a child's auth password, then emails the parent the new
// password so they can share it with the child directly (child accounts use
// fake emails and cannot receive emails themselves).
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM_EMAIL = "Hooper <noreply@hoop33.co.nz>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PASSWORD_RULE = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

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
    data: { user: callerUser },
    error: userError,
  } = await admin.auth.getUser(callerToken);

  if (userError || !callerUser) {
    return json(401, { ok: false, error: "Unauthorized" });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json(400, { ok: false, error: "Invalid request body" });
  }

  const { childProfileId, newPassword } = body as {
    childProfileId?: unknown;
    newPassword?: unknown;
  };

  if (typeof childProfileId !== "string" || !childProfileId.trim()) {
    return json(400, { ok: false, error: "Missing childProfileId" });
  }

  if (typeof newPassword !== "string" || !newPassword) {
    return json(400, {
      ok: false,
      field: "password",
      error: "Missing password",
    });
  }

  if (!PASSWORD_RULE.test(newPassword)) {
    return json(400, {
      ok: false,
      field: "password",
      error: "Password must be ≥8 chars with an uppercase letter and a number",
    });
  }

  // Resolve caller's profile
  const { data: callerProfile, error: profileError } = await admin
    .from("profiles")
    .select("id")
    .eq("auth_user_id", callerUser.id)
    .single();

  if (profileError || !callerProfile) {
    return json(401, { ok: false, error: "Unauthorized" });
  }

  // Confirm the caller is the active guardian of this child
  const { data: link, error: linkError } = await admin
    .from("parent_player_links")
    .select("id")
    .eq("parent_profile_id", callerProfile.id)
    .eq("player_profile_id", childProfileId)
    .eq("status", "active")
    .maybeSingle();

  if (linkError || !link) {
    return json(403, {
      ok: false,
      error: "You don't manage this child's account",
    });
  }

  // Get the child's auth_user_id and details
  const { data: childProfile, error: childProfileError } = await admin
    .from("profiles")
    .select("auth_user_id, first_name, username")
    .eq("id", childProfileId)
    .single();

  if (childProfileError || !childProfile) {
    return json(404, { ok: false, error: "Child account not found" });
  }

  // Update the child's password via admin API
  const { error: updateError } = await admin.auth.admin.updateUserById(
    childProfile.auth_user_id,
    { password: newPassword },
  );

  if (updateError) {
    return json(500, {
      ok: false,
      error: "Unable to reset password. Please try again.",
    });
  }

  // Email the parent the new password — best-effort, don't fail the request
  if (RESEND_API_KEY && callerUser.email) {
    try {
      await sendPasswordEmail({
        to: callerUser.email,
        childFirstName: childProfile.first_name,
        childUsername: childProfile.username,
        newPassword,
      });
    } catch {
      // intentionally swallowed
    }
  }

  return json(200, { ok: true });
});

async function sendPasswordEmail(opts: {
  to: string;
  childFirstName: string;
  childUsername: string;
  newPassword: string;
}): Promise<void> {
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [opts.to],
      subject: `${opts.childFirstName}'s Hooper password was reset`,
      html: buildEmailHtml(opts),
    }),
  });
}

function buildEmailHtml(opts: {
  childFirstName: string;
  childUsername: string;
  newPassword: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${opts.childFirstName}'s Hooper password was reset</title>
  <style>
    body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
    table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}
    img{-ms-interpolation-mode:bicubic;border:0;outline:none;text-decoration:none}
    body{margin:0;padding:0;width:100%!important;min-width:100%;background-color:#1F1B1C;font-family:'Inter','Helvetica Neue',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif}
    a{color:#F15825}
    .button-link{display:inline-block;background-color:#F15825;color:#ffffff!important;font-family:'Inter','Helvetica Neue',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;letter-spacing:0.075px;line-height:1;text-decoration:none!important;border-radius:9999px;padding:16px 28px}
    @media only screen and (max-width:600px){.email-container{width:100%!important}.button-link{display:block!important;text-align:center!important}.button-wrapper{text-align:center!important}}
  </style>
</head>
<body>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#1F1B1C;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table class="email-container" role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="background-color:#FAF7F4;border-radius:16px;overflow:hidden;">

          <!-- Hero -->
          <tr>
            <td style="background-color:#231F20;padding:28px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="left" valign="middle">
                    <img src="https://raw.githubusercontent.com/hoop33-dev/hooper/main/assets/images/logo.png" alt="Hooper" height="44" style="height:44px;width:auto;display:block;border:0;" />
                  </td>
                  <td align="right" valign="middle" style="font-size:10px;font-weight:600;letter-spacing:1.8px;text-transform:uppercase;color:#F15825;">
                    Account &middot; Security
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 36px 0 36px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:22px;">
                <tr>
                  <td style="width:76px;height:76px;background-color:rgba(241,88,37,0.08);border:1.5px solid rgba(241,88,37,0.22);border-radius:22px;text-align:center;vertical-align:middle;">
                    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="9" y="16" width="18" height="13" rx="3" stroke="#F15825" stroke-width="2.2"/>
                      <path d="M12 16V12C12 8.686 14.686 6 18 6C21.314 6 24 8.686 24 12V16" stroke="#F15825" stroke-width="2.2" stroke-linecap="round"/>
                      <circle cx="18" cy="22" r="2" fill="#F15825"/>
                    </svg>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 12px 0;font-size:11px;font-weight:600;letter-spacing:1.98px;text-transform:uppercase;color:#F15825;">Password reset</p>
              <h1 style="margin:0 0 14px 0;font-size:28px;font-weight:800;letter-spacing:-0.56px;line-height:1.15;color:#231F20;">${opts.childFirstName}&rsquo;s password<br/>was updated.</h1>
              <p style="margin:0;font-size:15px;line-height:1.6;color:#5A5152;">
                You reset the Hooper password for <strong style="color:#231F20;font-weight:600;">@${opts.childUsername}</strong>. Share the password below with ${opts.childFirstName} directly so they can sign in.
              </p>
            </td>
          </tr>

          <!-- Password box -->
          <tr>
            <td style="padding:24px 36px 0 36px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#231F20;border-radius:12px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <p style="margin:0 0 6px 0;font-size:10px;font-weight:600;letter-spacing:1.6px;text-transform:uppercase;color:rgba(255,255,255,0.45);">New password</p>
                    <p style="margin:0;font-size:20px;font-weight:700;letter-spacing:0.04em;color:#FFFFFF;font-family:'Courier New',Courier,monospace;">${opts.newPassword}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- How to use -->
          <tr>
            <td style="padding:16px 36px 0 36px;">
              <p style="margin:0;font-size:14px;line-height:1.6;color:#5A5152;">
                Have ${opts.childFirstName} open the Hooper app, sign in with their username <strong style="color:#231F20;">@${opts.childUsername}</strong>, and enter this password.
              </p>
            </td>
          </tr>

          <!-- Security notice -->
          <tr>
            <td style="padding:20px 36px 0 36px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:rgba(241,88,37,0.08);border:1px solid rgba(241,88,37,0.22);border-radius:12px;">
                <tr>
                  <td style="padding:16px 18px;">
                    <p style="margin:0;font-size:13px;line-height:1.55;color:#6F3318;">
                      <strong style="display:block;margin-bottom:2px;font-weight:600;">Share this privately.</strong>
                      Don&rsquo;t send the password via text or social media &mdash; tell ${opts.childFirstName} directly or use a secure method.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider + sign-off -->
          <tr>
            <td style="padding:28px 36px 28px 36px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr><td style="border-top:1px solid #E7E1DA;height:1px;font-size:1px;line-height:1px;">&nbsp;</td></tr>
              </table>
              <p style="margin:22px 0 0 0;font-size:13px;line-height:1.6;color:#5A5152;">
                Stay secure,<br/>
                <strong style="color:#231F20;font-weight:600;">The Hooper team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#F2EEE8;border-top:1px solid #E7E1DA;padding:22px 36px 26px 36px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-right:14px;"><a href="#" style="color:#5A5152;text-decoration:none;font-weight:500;font-size:12px;">Privacy</a></td>
                  <td><a href="#" style="color:#5A5152;text-decoration:none;font-weight:500;font-size:12px;">Terms</a></td>
                </tr>
              </table>
              <p style="margin:8px 0 0 0;font-size:11px;line-height:1.7;color:#8A8082;">Hooper Performance Ltd &middot; Auckland, New Zealand</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:10px;">
                <tr>
                  <td style="padding-top:10px;border-top:1px dashed #E7E1DA;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td align="left" style="font-size:11px;font-weight:700;letter-spacing:0.44px;color:#5A5152;">
                          <span style="display:inline-block;width:8px;height:8px;background-color:#F15825;border-radius:50%;margin-right:8px;vertical-align:middle;">&nbsp;</span>HOOPER
                        </td>
                        <td align="right" style="font-size:11px;line-height:1.7;color:#8A8082;">
                          Sent to you because you reset ${opts.childFirstName}&rsquo;s password.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
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
