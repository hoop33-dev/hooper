// Deploy: supabase functions deploy billing-invoices
//
// Authenticated. The billing portal's invoices and failed-charge retry:
//   { action: "list" } → { invoices: InvoiceRow[] }
//     The caller's Stripe invoices (membership charges) and one-off package
//     payments, newest first, each with a link to Stripe's hosted invoice
//     or receipt. Rows are named after the package and who it's for.
//   { action: "pay", purchaseId } → { ok, status }
//     Retries a failed (past_due) membership's open invoice against the
//     card on file. A decline comes back as { ok: false, error } with the
//     bank's message. Only the purchase's payer can do this.
// Lists come from the caller's own Stripe Customer, so a child signed in
// to the portal (who doesn't pay) sees no invoices.
import {
  adminClient,
  corsHeaders,
  json,
  resolveCaller,
} from "../_shared/http.ts";
import { listInvoices, retryMembership } from "../_shared/invoices.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const admin = adminClient();
    const caller = await resolveCaller(req, admin);
    if (!caller) return json(401, { ok: false, error: "Unauthorized" });

    let body: { action?: unknown; purchaseId?: unknown };
    try {
      body = await req.json();
    } catch {
      return json(400, { ok: false, error: "Invalid request body" });
    }

    if (body.action === "list") {
      const { data: row, error } = await admin
        .from("billing_customers")
        .select("stripe_customer_id")
        .eq("profile_id", caller.profileId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!row) return json(200, { ok: true, invoices: [] });
      const invoices = await listInvoices(
        admin,
        row.stripe_customer_id,
        caller.profileId,
      );
      return json(200, { ok: true, invoices });
    }

    if (body.action === "pay") {
      if (typeof body.purchaseId !== "string") {
        return json(400, { ok: false, error: "Missing membership" });
      }
      try {
        return await retryMembership(
          admin,
          body.purchaseId,
          (row) => row.payer_profile_id === caller.profileId,
          "Update your card on the Account page and try again.",
        );
      } catch (err) {
        console.error("billing-invoices: retry failed", err);
        return json(500, {
          ok: false,
          error: "Couldn't retry the payment. Please try again.",
        });
      }
    }

    return json(400, { ok: false, error: "Unknown action" });
  } catch (err) {
    console.error("billing-invoices: unhandled error", err);
    return json(500, { ok: false, error: "Unable to load invoices." });
  }
});
