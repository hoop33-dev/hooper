"use client";

import { AppQr, StoreBadges } from "@/src/components/app/AppLinks";
import { DarkCard, FormError, Hed } from "@/src/components/auth/AuthWrap";
import { CheckIcon } from "@/src/components/icons";
import { BtnLink, Spinner } from "@/src/components/ui/Btn";
import { withPackage } from "@/src/lib/routes";
import { useEffect, useState } from "react";
import { purchaseStatusAction } from "../checkout/actions";

const POLL_MS = 2000;
const GIVE_UP_AFTER = 20; // ~40s

type Phase = "confirming" | "active" | "slow" | "failed" | "none";

/** After payment the purchase only flips to active once Stripe's webhook
 * lands, usually within a couple of seconds. Poll until then. */
function usePurchasePhase(purchaseId: string | null, redirectFailed: boolean) {
  const [phase, setPhase] = useState<Phase>(() => {
    if (redirectFailed) return "failed";
    return purchaseId ? "confirming" : "none";
  });
  const [packageName, setPackageName] = useState<string | null>(null);

  useEffect(() => {
    if (!purchaseId || redirectFailed) return;
    let cancelled = false;
    let tries = 0;
    let timer: ReturnType<typeof setTimeout>;

    async function tick() {
      tries++;
      const res = await purchaseStatusAction(purchaseId!);
      if (cancelled) return;
      if (res) setPackageName(res.packageName);
      if (res?.status === "active" || res?.status === "past_due") {
        setPhase("active");
        return;
      }
      if (tries >= GIVE_UP_AFTER) {
        setPhase("slow");
        return;
      }
      timer = setTimeout(tick, POLL_MS);
    }
    void tick();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [purchaseId, redirectFailed]);

  return { phase, packageName };
}

export function WelcomeClient({
  purchaseId,
  slug,
  redirectFailed,
}: {
  purchaseId: string | null;
  slug: string | null;
  redirectFailed: boolean;
}) {
  const { phase, packageName } = usePurchasePhase(purchaseId, redirectFailed);

  if (phase === "failed") {
    return (
      <>
        <Hed sub="Your bank didn't approve the payment, so you haven't been charged.">
          Payment didn&apos;t go through.
        </Hed>
        <BtnLink
          href={withPackage("/checkout", slug)}
          variant="primary"
          size="lg"
          full>
          Try again
        </BtnLink>
      </>
    );
  }

  if (phase === "confirming") {
    return (
      <>
        <Hed sub="This only takes a moment — don't close this page.">
          Confirming payment.
        </Hed>
        <div className="flex items-center gap-3 text-sm text-white/60">
          <Spinner /> Waiting for Stripe…
        </div>
      </>
    );
  }

  const sub =
    phase === "slow"
      ? "Your payment is processing. Your package will appear in the app within a few minutes — we'll email you a receipt."
      : packageName
        ? `${packageName} is live. Now get the app — that's where the training happens.`
        : "Your account is ready. Now get the app — that's where the training happens.";

  return (
    <>
      <div className="bg-orange mb-[22px] flex size-[46px] items-center justify-center rounded-xl text-white">
        <CheckIcon size={22} />
      </div>
      <Hed sub={sub}>You&apos;re in.</Hed>
      {phase === "slow" && (
        <div className="mb-4">
          <FormError>
            Still confirming with Stripe. Check your account page shortly.
          </FormError>
        </div>
      )}
      <DarkCard className="flex flex-col items-center gap-5 p-[22px] text-center md:flex-row md:text-left">
        <AppQr size={124} />
        <div>
          <div className="mb-1.5 text-[15px] font-bold text-white">
            Scan to open Hooper
          </div>
          <div className="mb-3.5 text-[13px] leading-normal text-white/60">
            Point your phone camera at the code, then sign in with the same
            username and password.
          </div>
          <StoreBadges />
        </div>
      </DarkCard>
      <div className="mt-5">
        <BtnLink href="/account" variant="ghostDark" size="lg" full>
          Go to billing portal
        </BtnLink>
      </div>
    </>
  );
}
