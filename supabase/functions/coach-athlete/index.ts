// Deploy: supabase functions deploy coach-athlete
//
// Authenticated, coaches only. The coach portal's athlete page:
//   { action: "summary", athleteId }
//     → { memberships, payers, billable, invoices }
//     The athlete's packages, the card on file for whoever pays for them
//     (brand/last4/expiry only) and the Stripe invoices/receipts for this
//     athlete's purchases — a parent's other children are filtered out.
//     `billable` is who a new package can be charged to: the athlete and
//     their actively linked parents, with the card each has saved.
//   { action: "send_password_reset", athleteId } → { ok }
//     Emails the athlete Supabase's own reset link, to the address already
//     on their account. Refused for child accounts (their parent sets the
//     password). Throttled per athlete.
//   { action: "retry_payment", athleteId, purchaseId, invoiceId }
//     → { ok, status }
//     Retries that unpaid invoice of one of this athlete's past_due
//     memberships against the card already on file.
//   { action: "change_membership", athleteId, cancel?, add? } → { ok }
//     cancel: { purchaseId, when: "period_end" | "now" }
//     add:    { packageId, payerProfileId, startDate, billingDate }
//     Cancels a package, starts one on the payer's saved card, or both (a
//     switch) — see ./memberships.ts.
//   { action: "keep_membership", athleteId, purchaseId } → { ok }
//     Undoes a pending end-of-period cancel.
//
// A coach can never see, attach or change a card, or refund: new charges
// only go to a card the payer saved themselves. Every write lands in
// coach_audit_log. The writes refuse coach profiles as the target, like
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
import {
  changeMembership,
  keepMembership,
  parseAdd,
  parseCancel,
} from "./memberships.ts";

type Membership = {
  id: string;
  packageId: string;
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
  /** When access starts; null = from creation. */
  startsAt: string | null;
  /** First charge; null = charged at creation. */
  billingStartsAt: string | null;
  /** The package a switch replaced this one with. */
  switchedToName: string | null;
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
      cancel?: unknown;
      add?: unknown;
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
      body.action === "retry_payment" ||
      body.action === "change_membership" ||
      body.action === "keep_membership"
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

    if (body.action === "change_membership") {
      const cancel = parseCancel(body.cancel);
      const add = parseAdd(body.add);
      if (cancel === false || add === false || (!cancel && !add)) {
        return json(400, { ok: false, error: "Invalid membership change" });
      }
      if (!(await throttle(admin, `coach-membership:${athleteId}`, 20, 3600))) {
        return json(429, {
          ok: false,
          error: "Too many changes. Please wait a while and try again.",
        });
      }
      const { response, details } = await changeMembership(
        admin,
        athleteId,
        caller.profileId,
        cancel,
        add,
      );
      await audit(admin, caller.profileId, athleteId, "change_membership", {
        ...details,
        ok: response.ok,
      });
      return response;
    }

    if (body.action === "keep_membership") {
      if (typeof body.purchaseId !== "string") {
        return json(400, { ok: false, error: "Missing membership" });
      }
      const res = await keepMembership(admin, athleteId, body.purchaseId);
      await audit(admin, caller.profileId, athleteId, "keep_membership", {
        purchase_id: body.purchaseId,
        ok: res.ok,
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
      "id, package_id, kind, status, amount_cents, currency, current_period_end, cancel_at_period_end, paid_at, access_until, created_at, payer_profile_id, starts_at, billing_starts_at, stripe_subscription_id, stripe_payment_intent_id, stripe_invoice_id, packages(name, billing_interval), switched_to_purchase_id",
    )
    .eq("athlete_profile_id", athleteId)
    .neq("status", "incomplete")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as Array<{
    id: string;
    package_id: string;
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
    starts_at: string | null;
    billing_starts_at: string | null;
    stripe_subscription_id: string | null;
    stripe_payment_intent_id: string | null;
    stripe_invoice_id: string | null;
    packages: { name: string; billing_interval: string | null } | null;
    switched_to_purchase_id: string | null;
  }>;

  // A switch's new purchase is the same athlete's, so it's among the rows.
  const nameById = new Map(rows.map((r) => [r.id, r.packages?.name ?? null]));
  const memberships: Membership[] = rows.map((r) => ({
    id: r.id,
    packageId: r.package_id,
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
    startsAt: r.starts_at,
    billingStartsAt: r.billing_starts_at,
    switchedToName: r.switched_to_purchase_id
      ? (nameById.get(r.switched_to_purchase_id) ?? null)
      : null,
  }));

  // Usually one payer (the athlete, or their parent), but an athlete who
  // bought one package themselves and had another bought for them has two.
  const payerIds = [...new Set(rows.map((r) => r.payer_profile_id))];

  // Who a new package could be charged to: the athlete and their actively
  // linked parents.
  const { data: links, error: linkError } = await admin
    .from("parent_player_links")
    .select("parent_profile_id")
    .eq("player_profile_id", athleteId)
    .eq("status", "active");
  if (linkError) throw new Error(linkError.message);
  const billableIds = [
    ...new Set([athleteId, ...(links ?? []).map((l) => l.parent_profile_id)]),
  ];

  const profileIds = [...new Set([...payerIds, ...billableIds])];
  const [
    { data: customers, error: custError },
    { data: people, error: peopleError },
  ] = await Promise.all([
    admin
      .from("billing_customers")
      .select("profile_id, stripe_customer_id")
      .in("profile_id", profileIds),
    admin
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", profileIds),
  ]);
  if (custError) throw new Error(custError.message);
  if (peopleError) throw new Error(peopleError.message);
  const customerOf = new Map(
    (customers ?? []).map((c) => [c.profile_id, c.stripe_customer_id]),
  );
  const nameOf = new Map(
    (people ?? []).map((p) => [
      p.id,
      [p.first_name, p.last_name].filter(Boolean).join(" ") || "Unknown",
    ]),
  );

  const [everyone, invoices] = await Promise.all([
    Promise.all(
      profileIds.map(async (id): Promise<Payer> => {
        const customer = customerOf.get(id);
        const pm = customer ? await defaultPaymentMethod(customer) : null;
        return {
          profileId: id,
          name: nameOf.get(id) ?? "Unknown",
          isSelf: id === athleteId,
          card: pm ? cardSummary(pm) : null,
        };
      }),
    ),
    // Labels are named from the athlete's side, so passing them as the
    // "caller" keeps descriptions to just the package name.
    listPurchaseInvoices(admin, rows, athleteId),
  ]);
  const payers = everyone.filter((p) => payerIds.includes(p.profileId));
  const billable = everyone.filter(
    (p) => billableIds.includes(p.profileId) && p.card && !p.card.expired,
  );
  return { memberships, payers, billable, invoices };
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
