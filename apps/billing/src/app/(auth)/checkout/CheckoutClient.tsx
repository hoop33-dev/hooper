"use client";

import { signOutAction } from "@/src/app/(auth)/actions";
import {
  DarkCard,
  FormError,
  Hed,
  Sec,
  SecureNote,
} from "@/src/components/auth/AuthWrap";
import { CheckIcon } from "@/src/components/icons";
import {
  PAYMENT_ELEMENT_OPTIONS,
  StripeProvider,
} from "@/src/components/stripe/StripeProvider";
import { Btn, BtnLink, Spinner } from "@/src/components/ui/Btn";
import { Avatar } from "@/src/components/ui/primitives";
import { formatMoney, fullName, initials } from "@/src/lib/format";
import type { CheckoutStart } from "@/src/services/billing.service";
import type { MyProfile } from "@/src/services/profile.service";
import {
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { startCheckoutAction } from "./actions";

type State =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; start: CheckoutStart };

export function CheckoutClient({
  slug,
  priceCents,
  profile,
  justVerified,
}: {
  slug: string;
  priceCents: number;
  profile: MyProfile;
  justVerified: boolean;
}) {
  const [state, setState] = useState<State>({ kind: "loading" });
  const started = useRef(false);

  useEffect(() => {
    // Starting checkout creates Stripe objects — run it once per mount, even
    // under StrictMode's double effect.
    if (started.current) return;
    started.current = true;
    void begin(slug, setState);
  }, [slug]);

  return (
    <>
      <SignedInAs profile={profile} slug={slug} />
      {justVerified && <VerifiedBanner username={profile.username} />}
      <Body state={state} slug={slug} priceCents={priceCents} />
    </>
  );
}

async function begin(slug: string, setState: (s: State) => void) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await startCheckoutAction(slug);
    if (res.ok) return setState({ kind: "ready", start: res.data });
    // A parallel request (another tab, a double mount) holds the claim for a
    // moment — retry and we'll resume its attempt.
    if (res.error.code !== "in_progress") {
      return setState({ kind: "error", message: res.error.message });
    }
    await new Promise((r) => setTimeout(r, 1200));
  }
  setState({
    kind: "error",
    message: "Checkout is already open somewhere else. Refresh to continue.",
  });
}

function Body({
  state,
  slug,
  priceCents,
}: {
  state: State;
  slug: string;
  priceCents: number;
}) {
  if (state.kind === "loading") {
    return (
      <div className="flex items-center gap-3 py-10 text-sm text-white/60">
        <Spinner /> Preparing secure checkout…
      </div>
    );
  }
  if (state.kind === "error") return <FormError>{state.message}</FormError>;

  const { start } = state;
  if (start.status === "already_owned" || start.status === "processing") {
    return <AlreadyOwned processing={start.status === "processing"} />;
  }

  return (
    <>
      <Hed sub="Last step. Pay securely to unlock the package.">
        Pay and start.
      </Hed>
      <StripeProvider clientSecret={start.clientSecret} theme="dark">
        <PaymentForm
          purchaseId={start.purchaseId}
          amountLabel={formatMoney(start.amountCents ?? priceCents)}
          slug={slug}
        />
      </StripeProvider>
    </>
  );
}

function PaymentForm({
  purchaseId,
  amountLabel,
  slug,
}: {
  purchaseId: string;
  amountLabel: string;
  slug: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay(e: FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setPaying(true);
    setError(null);

    const welcome = `/welcome?purchase=${purchaseId}&package=${slug}`;
    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}${welcome}`,
      },
      redirect: "if_required",
    });

    if (stripeError) {
      setError(stripeError.message ?? "Payment failed. Please try again.");
      setPaying(false);
      return;
    }
    router.push(welcome);
  }

  return (
    <form onSubmit={pay}>
      <Sec n={1} title="Payment">
        {!ready && (
          <div className="flex items-center gap-3 py-6 text-sm text-white/60">
            <Spinner /> Loading card form…
          </div>
        )}
        <PaymentElement
          options={PAYMENT_ELEMENT_OPTIONS}
          onReady={() => setReady(true)}
        />
      </Sec>
      {error && (
        <div className="mb-4">
          <FormError>{error}</FormError>
        </div>
      )}
      <Btn
        type="submit"
        variant="primary"
        size="lg"
        full
        loading={paying}
        disabled={!stripe || !ready}>
        Pay {amountLabel}
      </Btn>
      <SecureNote />
    </form>
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

function AlreadyOwned({ processing }: { processing: boolean }) {
  return (
    <>
      <Hed
        sub={
          processing
            ? "Your payment went through — we're just finishing setting it up."
            : "This package is already on your account. Open the app to train."
        }>
        {processing ? "Almost done." : "You already have this."}
      </Hed>
      <DarkCard className="flex flex-col gap-3 p-[18px]">
        <BtnLink href="/welcome" variant="primary" size="lg" full>
          Get the app
        </BtnLink>
        <BtnLink href="/account" variant="ghostDark" size="lg" full>
          Go to billing portal
        </BtnLink>
      </DarkCard>
    </>
  );
}
