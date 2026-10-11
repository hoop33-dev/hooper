"use client";

import { CreditIcon, LockIcon, PlusIcon } from "@/src/components/icons";
import {
  PAYMENT_ELEMENT_OPTIONS,
  StripeProvider,
} from "@/src/components/stripe/StripeProvider";
import { Btn, Spinner } from "@/src/components/ui/Btn";
import { Card, Label, Tag } from "@/src/components/ui/primitives";
import { cn } from "@/src/lib/cn";
import type { CardSummary } from "@/src/services/billing.service";
import {
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
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

type Message = { tone: "ok" | "error"; text: string };

type Mode =
  | { kind: "view" }
  | { kind: "loading" }
  | { kind: "edit"; clientSecret: string };

export function PaymentMethodCard({
  card,
  error,
  initialMessage,
}: {
  card: CardSummary | null;
  error: string | null;
  /** Outcome of a redirected (3DS) card update, from ./card-return. */
  initialMessage: Message | null;
}) {
  const [mode, setMode] = useState<Mode>({ kind: "view" });
  const [message, setMessage] = useState<Message | null>(initialMessage);

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

  const editing = mode.kind === "edit";

  return (
    <Card>
      <Label className="mb-3.5">Payment method</Label>
      <div className="flex flex-col gap-3">
        {error ? (
          <div className="text-danger text-[13px]">{error}</div>
        ) : card ? (
          <CardOnFile
            card={card}
            action={
              !editing && (
                <Btn
                  variant={card.expired ? "primary" : "ghost"}
                  size="sm"
                  loading={mode.kind === "loading"}
                  onClick={startEdit}>
                  Update card
                </Btn>
              )
            }
          />
        ) : (
          !editing && (
            <button
              type="button"
              onClick={startEdit}
              disabled={mode.kind === "loading"}
              className="border-bp-border-mid text-bp-text2 flex h-[52px] items-center justify-center gap-2 rounded-xl border-[1.5px] border-dashed text-[13.5px] font-semibold disabled:opacity-50">
              {mode.kind === "loading" ? (
                <Spinner />
              ) : (
                <>
                  <PlusIcon size={16} /> Add payment method
                </>
              )}
            </button>
          )
        )}

        {editing && (
          <StripeProvider clientSecret={mode.clientSecret} theme="light">
            <UpdateCardForm
              onCancel={() => setMode({ kind: "view" })}
              onSaved={() => {
                setMode({ kind: "view" });
                setMessage({ tone: "ok", text: "Card updated." });
              }}
            />
          </StripeProvider>
        )}

        {message && (
          <div
            role="status"
            className={
              message.tone === "ok"
                ? "text-green text-[12.5px]"
                : "text-danger text-[12.5px]"
            }>
            {message.text}
          </div>
        )}
        <div className="text-bp-text3 flex items-center gap-2.5 text-xs">
          <LockIcon size={13} className="shrink-0" /> Cards are stored by
          Stripe. Hooper only sees the last 4 digits.
        </div>
      </div>
    </Card>
  );
}

/** Design `PaymentMethods` row for the one default card. */
function CardOnFile({
  card,
  action,
}: {
  card: CardSummary;
  action: ReactNode;
}) {
  return (
    <div
      className={cn(
        "bg-bp-card flex flex-wrap items-center gap-3 rounded-xl border p-4",
        card.expired ? "border-danger/30" : "border-bp-border",
      )}>
      <div className="border-bp-border bg-bp-bg text-bp-text2 flex h-[30px] w-11 shrink-0 items-center justify-center rounded-md border">
        <CreditIcon size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-bp-text1 text-sm font-bold whitespace-nowrap">
          {brandName(card.brand)} •••• {card.last4}
        </div>
        <div className="mt-[3px] flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "text-[12.5px]",
              card.expired ? "text-danger font-semibold" : "text-bp-text2",
            )}>
            {card.expired ? "Expired" : "Expires"} {expiry(card)}
          </span>
          <Tag tone="blue">Default</Tag>
        </div>
      </div>
      {action}
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
      // If the bank needs a redirect, this code never resumes — card-return
      // sets the default card instead.
      confirmParams: {
        return_url: `${window.location.origin}/account/card-return`,
      },
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
