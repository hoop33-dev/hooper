import type { MyChild, MyPackagePurchase } from "@hooper/db";

/** Test-only builders for RPC row shapes. */
export function purchase(
  over: Partial<MyPackagePurchase> = {},
): MyPackagePurchase {
  return {
    id: "p1",
    package_id: "k1",
    package_name: "Pack",
    package_slug: "pack",
    billing_type: "recurring",
    billing_interval: "month",
    access_weeks: null,
    athlete_profile_id: "kid1",
    athlete_first_name: "Liam",
    athlete_last_name: "Whitfield",
    athlete_username: "liamw",
    kind: "subscription",
    status: "active",
    amount_cents: 3900,
    currency: "nzd",
    current_period_end: "2999-01-01T00:00:00Z",
    access_until: null,
    paid_at: "2026-10-01T00:00:00Z",
    created_at: "2026-10-01T00:00:00Z",
    ...over,
  };
}

export function child(over: Partial<MyChild> = {}): MyChild {
  return {
    profile_id: "kid1",
    first_name: "Liam",
    last_name: "Whitfield",
    username: "liamw",
    date_of_birth: "2011-03-14",
    region_id: null,
    has_real_email: false,
    linked_at: "2026-10-01T00:00:00Z",
    ...over,
  };
}
