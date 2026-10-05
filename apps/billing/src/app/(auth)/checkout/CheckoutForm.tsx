"use client";

import { createChildAction } from "@/src/app/childActions";
import { FormError, Sec, SecureNote } from "@/src/components/auth/AuthWrap";
import { ChildPicker } from "@/src/components/auth/ChildPicker";
import { ForToggle } from "@/src/components/auth/ForToggle";
import {
  ChildFields,
  EMPTY_CHILD,
} from "@/src/components/children/ChildFields";
import { PAYMENT_ELEMENT_OPTIONS } from "@/src/components/stripe/StripeProvider";
import { Btn, Spinner } from "@/src/components/ui/Btn";
import {
  childChoiceDefault,
  forWhoFirstName,
  isForChild,
  type ForChoice,
} from "@/src/lib/checkoutFor";
import { formatMoney } from "@/src/lib/format";
import type { ChildFormFields, FieldErrors } from "@/src/lib/validation";
import type { MyChild } from "@hooper/db";
import { useReportNavPending } from "@hooper/shared/next";
import {
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import type { Stripe, StripeElements } from "@stripe/stripe-js";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { startCheckoutAction } from "./actions";

type Props = {
  slug: string;
  priceCents: number;
  choice: ForChoice;
  onChoiceChange: (c: ForChoice) => void;
  childList: MyChild[];
  onChildCreated: (child: MyChild) => void;
};

export function CheckoutForm(props: Props) {
  const { choice, onChoiceChange, childList, priceCents } = props;
  const stripe = useStripe();
  const elements = useElements();
  const [ready, setReady] = useState(false);
  const [child, setChild] = useState<ChildFormFields>(EMPTY_CHILD);
  const pay = usePay(props, child);
  const forChild = isForChild(choice);
  const newChild = choice.who === "new_child";
  let n = 1;

  return (
    <form
      noValidate
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        if (stripe && elements) void pay.run(stripe, elements);
      }}>
      <Sec
        n={n++}
        title="Who's this for?"
        sub={
          forChild
            ? "You pay and manage billing. Your child gets their own login for the app."
            : undefined
        }>
        <ForToggle
          forChild={forChild}
          disabled={pay.busy}
          onChange={(c) =>
            onChoiceChange(c ? childChoiceDefault(childList) : { who: "me" })
          }
        />
        {forChild && childList.length > 0 && (
          <ChildPicker
            childList={childList}
            choice={choice}
            onChange={onChoiceChange}
            disabled={pay.busy}
          />
        )}
      </Sec>
      {newChild && (
        <Sec n={n++} title="Your child's account">
          <ChildFields
            dark
            values={child}
            errors={pay.childErrors}
            onChange={setChild}
            disabled={pay.busy}
          />
        </Sec>
      )}
      <Sec n={n++} title="Payment">
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
      {pay.error && (
        <div className="mb-4">
          <FormError>{pay.error}</FormError>
        </div>
      )}
      <Btn
        type="submit"
        variant="primary"
        size="lg"
        full
        loading={pay.busy}
        disabled={!stripe || !ready}>
        Pay {formatMoney(priceCents)}
        {newChild ? " and create account" : ""}
      </Btn>
      <SecureNote />
    </form>
  );
}

/** The Pay sequence: validate the card form → create the child if needed →
 * create/resume the Stripe intent for the chosen athlete → confirm. */
function usePay(props: Props, child: ChildFormFields) {
  const { slug, choice, childList, onChildCreated } = props;
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  // The push to /welcome waits on its RSC payload; keep Pay locked and the top
  // bar running until it lands.
  const [navigating, startNav] = useTransition();
  useReportNavPending(navigating);
  const [error, setError] = useState<string | null>(null);
  const [childErrors, setChildErrors] = useState<
    FieldErrors<keyof ChildFormFields>
  >({});

  async function run(stripe: Stripe, elements: StripeElements) {
    setBusy(true);
    setError(null);
    setChildErrors({});
    try {
      const { error: submitError } = await elements.submit();
      if (submitError)
        return setError(submitError.message ?? "Check your card details.");

      const athlete = await resolveAthlete();
      if (athlete === undefined) return;

      const start = await startWithRetry(slug, athlete?.id);
      if (!start.ok) return setError(start.message);
      const { data } = start;
      if (data.status === "already_owned") {
        const who = athlete?.firstName ?? forWhoFirstName(choice, childList);
        return setError(
          who
            ? `${who} already has this package.`
            : "You already have this package.",
        );
      }
      const welcome = `/welcome?purchase=${data.purchaseId}&package=${slug}`;
      if (data.status === "processing")
        return startNav(() => router.push(welcome));

      const { error: payError } = await stripe.confirmPayment({
        elements,
        clientSecret: data.clientSecret,
        confirmParams: { return_url: `${window.location.origin}${welcome}` },
        redirect: "if_required",
      });
      if (payError)
        return setError(
          payError.message ?? "Payment failed. Please try again.",
        );
      startNav(() => router.push(welcome));
    } finally {
      setBusy(false);
    }
  }

  /** undefined = stopped (errors shown); null = buying for myself. */
  async function resolveAthlete(): Promise<
    { id: string; firstName: string | null } | null | undefined
  > {
    if (choice.who === "me") return null;
    if (choice.who === "child") {
      return {
        id: choice.childId,
        firstName: forWhoFirstName(choice, childList),
      };
    }
    const res = await createChildAction(child);
    if (!res.ok) {
      setChildErrors(res.errors);
      setError(res.formError ?? "Check your child's details.");
      return undefined;
    }
    const c = res.data;
    onChildCreated({
      profile_id: c.id,
      first_name: c.firstName,
      last_name: c.lastName,
      username: c.username,
      date_of_birth: c.dateOfBirth,
      region_id: null,
      has_real_email: false,
      linked_at: new Date().toISOString(),
    });
    return { id: c.id, firstName: c.firstName };
  }

  return { run, busy: busy || navigating, error, childErrors };
}

/** A parallel request (another tab, a double click) can hold the purchase
 * claim for a moment while it creates its Stripe object — retry briefly and
 * we'll resume its attempt. */
async function startWithRetry(slug: string, athleteId: string | undefined) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await startCheckoutAction(slug, athleteId);
    if (res.ok) return { ok: true as const, data: res.data };
    if (res.error.code !== "in_progress") {
      return { ok: false as const, message: res.error.message };
    }
    await new Promise((r) => setTimeout(r, 1200));
  }
  return {
    ok: false as const,
    message: "Checkout is already open somewhere else. Refresh to continue.",
  };
}
