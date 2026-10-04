"use client";

import { CreditIcon, LockIcon } from "@/src/components/icons";
import {
  PAYMENT_ELEMENT_OPTIONS,
  StripeProvider,
} from "@/src/components/stripe/StripeProvider";
import { Btn, Spinner } from "@/src/components/ui/Btn";
import { Card, Label } from "@/src/components/ui/primitives";
import type { CardSummary } from "@/src/services/billing.service";
import {
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createSetupIntentAction, setDefaultCardAction } from "./actions";

function brandName(brand: string) {
  const names: Record<string, string> = {
    visa: "Visa",
    mastercard: "Mastercard",
    amex: "Amex",
    discover: "Discover",
    jcb: "JCB",
    diners: "Diners",
    unionpay: "UnionPay",
  };
  return names[brand] ?? brand.charAt(0).toUpperCase() + brand.slice(1);
}

function expiry(card: CardSummary) {
  return `${String(card.exp_month).padStart(2, "0")}/${String(card.exp_year).slice(-2)}`;
}

type Mode =
  | { kind: "view" }
  | { kind: "loading" }
  | { kind: "edit"; clientSecret: string };

export function PaymentMethodCard({
  card,
  error,
}: {
  card: CardSummary | null;
  error: string | null;
}) {
  const [mode, setMode] = useState<Mode>({ kind: "view" });
  const [message, setMessage] = useState<{
    tone: "ok" | "error";
    text: string;
  } | null>(null);

  async function startEdit() {
    setMessage(null);
    setMode({ kind: "loading" });
    const res = await createSetupIntentAction();
    if (!res.ok) {
      setMessage({ tone: "error", text: res.error });
      setMode({ kind: "view" });
      return;
    }
    setMode({ kind: "edit", clientSecret: res.data });
  }

  return (
    <Card className={card?.expired ? "border-danger/30" : undefined}>
      <Label className="mb-3">Payment method</Label>

      <CardOnFile card={card} error={error} />

      {mode.kind === "edit" ? (
        <StripeProvider clientSecret={mode.clientSecret} theme="light">
          <UpdateCardForm
            onCancel={() => setMode({ kind: "view" })}
            onSaved={() => {
              setMode({ kind: "view" });
              setMessage({ tone: "ok", text: "Card updated." });
            }}
          />
        </StripeProvider>
      ) : (
        <Btn
          variant={card?.expired || !card ? "primary" : "ghost"}
          size="sm"
          full
          loading={mode.kind === "loading"}
          onClick={startEdit}>
          {card ? "Update card" : "Add card"}
        </Btn>
      )}

      {message && (
        <div
          role="status"
          className={`mt-2.5 text-[12.5px] ${message.tone === "ok" ? "text-green" : "text-danger"}`}>
          {message.text}
        </div>
      )}
      <div className="text-bp-text3 mt-3 flex items-center gap-2 text-xs">
        <LockIcon size={13} className="shrink-0" /> Cards are stored by Stripe.
        Hooper only sees the last 4 digits.
      </div>
    </Card>
  );
}

function CardOnFile({
  card,
  error,
}: {
  card: CardSummary | null;
  error: string | null;
}) {
  if (error) return <div className="text-danger mb-3 text-[13px]">{error}</div>;
  if (!card)
    return (
      <div className="text-bp-text2 mb-3 text-[13px]">No card on file.</div>
    );
  return (
    <div className="mb-3 flex items-center gap-[11px]">
      <div className="border-bp-border bg-bp-bg text-bp-text2 flex h-[27px] w-10 items-center justify-center rounded-md border">
        <CreditIcon size={15} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-bp-text1 text-[13px] font-semibold">
          {brandName(card.brand)} •••• {card.last4}
        </div>
        <div
          className={
            card.expired
              ? "text-danger text-[11.5px]"
              : "text-bp-text3 text-[11.5px]"
          }>
          {card.expired ? "Expired" : "Expires"} {expiry(card)}
        </div>
      </div>
    </div>
  );
}

function UpdateCardForm({
  onCancel,
  onSaved,
}: {
  onCancel: () => void;
  onSaved: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSaving(true);
    setError(null);

    const { error: stripeError, setupIntent } = await stripe.confirmSetup({
      elements,
      confirmParams: { return_url: `${window.location.origin}/account` },
      redirect: "if_required",
    });
    if (stripeError || !setupIntent?.payment_method) {
      setError(stripeError?.message ?? "Couldn't save that card.");
      setSaving(false);
      return;
    }

    const pmId =
      typeof setupIntent.payment_method === "string"
        ? setupIntent.payment_method
        : setupIntent.payment_method.id;
    const res = await setDefaultCardAction(pmId);
    if (!res.ok) {
      setError(res.error);
      setSaving(false);
      return;
    }
    router.refresh();
    onSaved();
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-3">
      {!ready && (
        <div className="text-bp-text2 flex items-center gap-2 py-3 text-[13px]">
          <Spinner /> Loading card form…
        </div>
      )}
      <PaymentElement
        options={PAYMENT_ELEMENT_OPTIONS}
        onReady={() => setReady(true)}
      />
      {error && (
        <div role="alert" className="text-danger text-[12.5px]">
          {error}
        </div>
      )}
      <div className="flex gap-2">
        <Btn
          type="submit"
          variant="primary"
          size="sm"
          loading={saving}
          disabled={!stripe || !ready}
          className="flex-1">
          Save card
        </Btn>
        <Btn variant="quiet" size="sm" onClick={onCancel} disabled={saving}>
          Cancel
        </Btn>
      </div>
    </form>
  );
}
