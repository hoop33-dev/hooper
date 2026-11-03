// Deploy: supabase functions deploy billing-membership
//
// Authenticated. Lets the payer stop a monthly membership from the billing
// portal:
//   { action: "cancel", purchaseId, reason? } → { ok }
//     active   → cancels at the end of the paid period (access continues
//                until then; the webhook moves the row to 'canceled')
//     past_due → cancels now — there's no paid period left to run out, and
//                it stops Stripe retrying the failed charge
//   { action: "keep", purchaseId } → { ok }
//     undoes a pending end-of-period cancel
// Only the purchase's payer may do either (a child can't stop a membership
// their parent pays for). The row is updated straight away so the portal
// reflects the change without waiting for the webhook.
import {
  adminClient,
  corsHeaders,
  json,
  resolveCaller,
} from "../_shared/http.ts";
import { stripe } from "../_shared/stripe.ts";

const REASONS = new Set([
  "Season is over",
  "Too expensive",
  "Not using it",
  "Changing coach",
  "Other",
]);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const admin = adminClient();
    const caller = await resolveCaller(req, admin);
    if (!caller) return json(401, { ok: false, error: "Unauthorized" });

    let body: { action?: unknown; purchaseId?: unknown; reason?: unknown };
    try {
      body = await req.json();
    } catch {
      return json(400, { ok: false, error: "Invalid request body" });
    }
    if (typeof body.purchaseId !== "string") {
      return json(400, { ok: false, error: "Missing membership" });
    }

    const { data: row, error: readError } = await admin
      .from("package_purchases")
      .select(
        "id, payer_profile_id, kind, status, stripe_subscription_id, cancel_at_period_end",
      )
      .eq("id", body.purchaseId)
      .maybeSingle();
    if (readError) throw new Error(readError.message);
    if (!row || row.payer_profile_id !== caller.profileId) {
      return json(404, { ok: false, error: "Membership not found" });
    }
    if (row.kind !== "subscription" || !row.stripe_subscription_id) {
      return json(400, {
        ok: false,
        error: "One-off packages don't renew, so there's nothing to stop.",
      });
    }

    if (body.action === "cancel") {
      if (row.status !== "active" && row.status !== "past_due") {
        return json(409, { ok: false, error: "This membership has ended." });
      }
      const reason =
        typeof body.reason === "string" && REASONS.has(body.reason)
          ? body.reason
          : null;

      if (row.status === "past_due") {
        await stripe.subscriptions.cancel(row.stripe_subscription_id, {
          cancellation_details: reason ? { comment: reason } : undefined,
        });
        await update(admin, row.id, {
          status: "canceled",
          canceled_at: new Date().toISOString(),
          cancel_at_period_end: false,
          cancel_reason: reason,
        });
      } else {
        await stripe.subscriptions.update(row.stripe_subscription_id, {
          cancel_at_period_end: true,
          ...(reason ? { cancellation_details: { comment: reason } } : {}),
        });
        await update(admin, row.id, {
          cancel_at_period_end: true,
          cancel_reason: reason,
        });
      }
      return json(200, { ok: true });
    }

    if (body.action === "keep") {
      if (row.status !== "active" || !row.cancel_at_period_end) {
        return json(409, {
          ok: false,
          error: "This membership isn't set to stop.",
        });
      }
      await stripe.subscriptions.update(row.stripe_subscription_id, {
        cancel_at_period_end: false,
      });
      await update(admin, row.id, {
        cancel_at_period_end: false,
        cancel_reason: null,
      });
      return json(200, { ok: true });
    }

    return json(400, { ok: false, error: "Unknown action" });
  } catch (err) {
    console.error("billing-membership: unhandled error", err);
    return json(500, {
      ok: false,
      error: "Couldn't update that membership. Please try again.",
    });
  }
});

async function update(
  admin: ReturnType<typeof adminClient>,
  id: string,
  patch: Record<string, unknown>,
) {
  const { error } = await admin
    .from("package_purchases")
    .update(patch)
    .eq("id", id);
  if (error) throw new Error(error.message);
}
