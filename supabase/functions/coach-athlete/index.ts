// Deploy: supabase functions deploy coach-athlete
//
// Authenticated, coaches only. The coach portal's athlete page:
//   { action: "summary", athleteId } → { memberships, payers, invoices }
//     The athlete's packages, the card on file for whoever pays for them
//     (brand/last4/expiry only) and the Stripe invoices/receipts for this
//     athlete's purchases — a parent's other children are filtered out.
//   { action: "send_password_reset", athleteId } → { ok }
//     Emails the athlete Supabase's own reset link, to the address already
//     on their account. Refused for child accounts (their parent sets the
//     password). Throttled per athlete.
//   { action: "retry_payment", athleteId, purchaseId, invoiceId }
//     → { ok, status }
//     Retries that unpaid invoice of one of this athlete's past_due
//     memberships against the card already on file.
//
// Deliberately read-mostly: there is no path here to start a checkout,
// attach or change a card, cancel, refund or create any new charge — a
// coach can only collect what an athlete already owes. Every write lands
// in coach_audit_log. The writes refuse coach profiles as the target, like
// coach_update_athlete_profile does.
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  adminClient,
  corsHeaders,
  json,
  resolveCaller,
} from "../_shared/http.ts";
import { listPurchaseInvoices, retryMembership } from "../_shared/invoices.ts";
import {
  cardSummary,
  type CardSummary,
  defaultPaymentMethod,
} from "../_shared/stripe.ts";

type Membership = {
  id: string;
  packageName: string;
  kind: "subscription" | "one_time";
  status: "active" | "past_due" | "canceled" | "expired";
  amountCents: number;
  currency: string;
  interval: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  paidAt: string | null;
  accessUntil: string | null;
  createdAt: string;
  payerProfileId: string;
};

type Payer = {
  profileId: string;
  name: string;
  isSelf: boolean;
  card: CardSummary | null;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const admin = adminClient();
    const caller = await resolveCaller(req, admin);
    if (!caller) return json(401, { ok: false, error: "Unauthorized" });

    const { data: role, error: roleError } = await admin
      .from("user_roles")
      .select("role")
      .eq("profile_id", caller.profileId)
      .eq("role", "coach")
      .maybeSingle();
    if (roleError) throw new Error(roleError.message);
    if (!role) return json(403, { ok: false, error: "Coaches only" });

    let body: {
      action?: unknown;
      athleteId?: unknown;
      purchaseId?: unknown;
      invoiceId?: unknown;
    };
    try {
      body = await req.json();
    } catch {
      return json(400, { ok: false, error: "Invalid request body" });
    }
    if (typeof body.athleteId !== "string") {
      return json(400, { ok: false, error: "Missing athlete" });
    }
    const athleteId = body.athleteId;

    if (body.action === "summary") {
      return json(200, { ok: true, ...(await summary(admin, athleteId)) });
    }

    if (
      body.action === "send_password_reset" ||
      body.action === "retry_payment"
    ) {
      const { data: targetRole, error: targetError } = await admin
        .from("user_roles")
        .select("role")
        .eq("profile_id", athleteId)
        .eq("role", "coach")
        .maybeSingle();
      if (targetError) throw new Error(targetError.message);
      if (targetRole) {
        return json(403, {
          ok: false,
          error: "Coach accounts can't be managed here.",
        });
      }
    }

    if (body.action === "send_password_reset") {
      return await sendPasswordReset(admin, caller.profileId, athleteId);
    }

    if (body.action === "retry_payment") {
      if (
        typeof body.purchaseId !== "string" ||
        typeof body.invoiceId !== "string"
      ) {
        return json(400, { ok: false, error: "Missing invoice" });
      }
      const purchaseId = body.purchaseId;
      const invoiceId = body.invoiceId;
      if (!(await throttle(admin, `coach-retry:${purchaseId}`, 5, 3600))) {
        return json(429, {
          ok: false,
          error: "Too many retries. Please wait a while and try again.",
        });
      }
      const res = await retryMembership(
        admin,
        purchaseId,
        (row) => row.athlete_profile_id === athleteId,
        "Ask them to update their card in the billing portal, then try again.",
        invoiceId,
      );
      const result = (await res.clone().json()) as { ok: boolean };
      await audit(admin, caller.profileId, athleteId, "retry_payment", {
        purchase_id: purchaseId,
        invoice_id: invoiceId,
        ok: result.ok,
      });
      return res;
    }

    return json(400, { ok: false, error: "Unknown action" });
  } catch (err) {
    console.error("coach-athlete: unhandled error", err);
    return json(500, { ok: false, error: "Something went wrong." });
  }
});

async function summary(admin: SupabaseClient, athleteId: string) {
  const { data, error } = await admin
    .from("package_purchases")
    .select(
      "id, kind, status, amount_cents, currency, current_period_end, cancel_at_period_end, paid_at, access_until, created_at, payer_profile_id, stripe_subscription_id, stripe_payment_intent_id, packages(name, billing_interval), payer:profiles!package_purchases_payer_profile_id_fkey(first_name, last_name)",
    )
    .eq("athlete_profile_id", athleteId)
    .neq("status", "incomplete")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as Array<{
    id: string;
    kind: Membership["kind"];
    status: Membership["status"];
    amount_cents: number;
    currency: string;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
    paid_at: string | null;
    access_until: string | null;
    created_at: string;
    payer_profile_id: string;
    stripe_subscription_id: string | null;
    stripe_payment_intent_id: string | null;
    packages: { name: string; billing_interval: string | null } | null;
    payer: { first_name: string | null; last_name: string | null } | null;
  }>;

  const memberships: Membership[] = rows.map((r) => ({
    id: r.id,
    packageName: r.packages?.name ?? "Package",
    kind: r.kind,
    status: r.status,
    amountCents: r.amount_cents,
    currency: r.currency,
    interval:
      r.kind === "subscription" ? (r.packages?.billing_interval ?? null) : null,
    currentPeriodEnd: r.current_period_end,
    cancelAtPeriodEnd: r.cancel_at_period_end,
    paidAt: r.paid_at,
    accessUntil: r.access_until,
    createdAt: r.created_at,
    payerProfileId: r.payer_profile_id,
  }));

  // Usually one payer (the athlete, or their parent), but an athlete who
  // bought one package themselves and had another bought for them has two.
  const payerIds = [...new Set(rows.map((r) => r.payer_profile_id))];
  const { data: customers, error: custError } = payerIds.length
    ? await admin
        .from("billing_customers")
        .select("profile_id, stripe_customer_id")
        .in("profile_id", payerIds)
    : { data: [], error: null };
  if (custError) throw new Error(custError.message);
  const customerOf = new Map(
    (customers ?? []).map((c) => [c.profile_id, c.stripe_customer_id]),
  );

  const [payers, invoices] = await Promise.all([
    Promise.all(
      payerIds.map(async (id): Promise<Payer> => {
        const row = rows.find((r) => r.payer_profile_id === id)!;
        const customer = customerOf.get(id);
        const pm = customer ? await defaultPaymentMethod(customer) : null;
        return {
          profileId: id,
          name:
            [row.payer?.first_name, row.payer?.last_name]
              .filter(Boolean)
              .join(" ") || "Unknown",
          isSelf: id === athleteId,
          card: pm ? cardSummary(pm) : null,
        };
      }),
    ),
    // Labels are named from the athlete's side, so passing them as the
    // "caller" keeps descriptions to just the package name.
    listPurchaseInvoices(admin, rows, athleteId),
  ]);
  return { memberships, payers, invoices };
}

async function sendPasswordReset(
  admin: SupabaseClient,
  coachId: string,
  athleteId: string,
) {
  const { data: profile, error } = await admin
    .from("profiles")
    .select("auth_user_id, has_real_email")
    .eq("id", athleteId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!profile) return json(404, { ok: false, error: "Athlete not found" });
  if (!profile.has_real_email) {
    return json(409, {
      ok: false,
      error: "This is a child account. Their parent sets their password.",
    });
  }

  if (!(await throttle(admin, `coach-reset:${athleteId}`, 3, 3600))) {
    return json(429, {
      ok: false,
      error: "A reset was sent recently. Please wait before sending another.",
    });
  }

  const { data: authUser, error: userError } =
    await admin.auth.admin.getUserById(profile.auth_user_id);
  const email = authUser?.user?.email;
  if (userError || !email) {
    return json(409, {
      ok: false,
      error: "This athlete has no email address.",
    });
  }

  // Same email and redirect as "Forgot password" in the app
  // (packages/api/src/services/auth.service.ts), always to the address on
  // the account — the coach never chooses where it goes. The admin client
  // uses the implicit flow, so the link lands as `#access_token=…` rather
  // than a PKCE `?code=` (this device holds no code verifier for the
  // athlete's); the app's reset screen accepts both.
  const { error: resetError } = await admin.auth.resetPasswordForEmail(email, {
    redirectTo: "hooper://reset-password",
  });
  if (resetError) {
    console.error("coach-athlete: reset failed", resetError);
    return json(502, {
      ok: false,
      error: "Couldn't send the reset email. Please try again.",
    });
  }

  await audit(admin, coachId, athleteId, "send_password_reset", {});
  return json(200, { ok: true });
}

/** Counts an attempt against `key`; false once it's over `max` in the
 * window. Fails open if the throttle itself errors, like sign-in does. */
async function throttle(
  admin: SupabaseClient,
  key: string,
  max: number,
  windowSeconds: number,
): Promise<boolean> {
  const { data } = await admin.rpc("register_signin_attempt", {
    p_key: key,
    p_max: max,
    p_window_seconds: windowSeconds,
  });
  return data !== false;
}

async function audit(
  admin: SupabaseClient,
  coachId: string,
  athleteId: string,
  action: string,
  details: Record<string, unknown>,
) {
  const { error } = await admin.from("coach_audit_log").insert({
    coach_profile_id: coachId,
    athlete_profile_id: athleteId,
    action,
    details,
  });
  if (error) console.error("coach-athlete: audit insert failed", error);
}
