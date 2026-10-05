"use client";

import { signOutAction } from "@/src/app/(auth)/actions";
import { Hed } from "@/src/components/auth/AuthWrap";
import { CheckoutLayout } from "@/src/components/auth/PackageCard";
import { CheckIcon } from "@/src/components/icons";
import { DeferredStripeProvider } from "@/src/components/stripe/StripeProvider";
import { Avatar } from "@/src/components/ui/primitives";
import { forWhoLabel, type ForChoice } from "@/src/lib/checkoutFor";
import { fullName, initials } from "@/src/lib/format";
import type { MyProfile } from "@/src/services/profile.service";
import type { MyChild, PublicPackage } from "@hooper/db";
import { useState } from "react";
import { CheckoutForm } from "./CheckoutForm";

/** Checkout: choose who it's for (me / an existing child / a new child),
 * then pay. The Payment Element runs in deferred-intent mode, so nothing is
 * created in Stripe until Pay is pressed. */
export function CheckoutClient({
  slug,
  pkg,
  profile,
  initialChildren,
  justVerified,
}: {
  slug: string;
  pkg: PublicPackage;
  profile: MyProfile;
  initialChildren: MyChild[];
  justVerified: boolean;
}) {
  const [childList, setChildList] = useState(initialChildren);
  const [choice, setChoice] = useState<ForChoice>({ who: "me" });

  return (
    <CheckoutLayout pkg={pkg} forWho={forWhoLabel(choice, profile, childList)}>
      <SignedInAs profile={profile} slug={slug} />
      {justVerified && <VerifiedBanner username={profile.username} />}
      <Hed
        sub={
          justVerified
            ? "Last step. Choose who it’s for, then pay to unlock the package."
            : "Confirm who it's for and pay."
        }>
        {justVerified ? "Pay and start." : "Almost there."}
      </Hed>
      <DeferredStripeProvider
        mode={pkg.billing_type === "recurring" ? "subscription" : "payment"}
        amountCents={pkg.price_cents}
        currency={pkg.currency}>
        <CheckoutForm
          slug={slug}
          priceCents={pkg.price_cents}
          choice={choice}
          onChoiceChange={setChoice}
          childList={childList}
          onChildCreated={(child) => {
            // Keep the new child selected so a failed payment retries for
            // them instead of creating a duplicate.
            setChildList((list) => [...list, child]);
            setChoice({ who: "child", childId: child.profile_id });
          }}
        />
      </DeferredStripeProvider>
    </CheckoutLayout>
  );
}

function SignedInAs({ profile, slug }: { profile: MyProfile; slug: string }) {
  const name =
    fullName(profile.firstName, profile.lastName) || profile.username;
  return (
    <div className="mb-[26px] flex items-center gap-3 rounded-xl border border-white/10 px-3.5 py-3">
      <Avatar
        initials={initials(profile.firstName, profile.lastName)}
        size={32}
        tone="navy"
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13.5px] font-bold text-white">
          Signed in as {name}
        </div>
        {profile.username && (
          <div className="text-xs text-white/40">@{profile.username}</div>
        )}
      </div>
      <form action={signOutAction}>
        <input type="hidden" name="package" value={slug} />
        <button type="submit" className="text-[12.5px] text-white/60 underline">
          Not you?
        </button>
      </form>
    </div>
  );
}

function VerifiedBanner({ username }: { username: string | null }) {
  return (
    <div className="border-success/30 bg-success/10 mb-[26px] flex items-center gap-2.5 rounded-[10px] border px-3.5 py-2.5 text-[13px] text-white">
      <CheckIcon size={15} className="text-success" />
      <span>
        <b>Email verified.</b>{" "}
        <span className="text-white/60">
          Account{username ? ` @${username}` : ""} created
        </span>
      </span>
    </div>
  );
}
