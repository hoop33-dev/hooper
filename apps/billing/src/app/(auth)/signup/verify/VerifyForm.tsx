"use client";

import { FormError, Hed } from "@/src/components/auth/AuthWrap";
import { CODE_LENGTH, CodeInput } from "@/src/components/auth/CodeInput";
import { MailIcon } from "@/src/components/icons";
import { Btn } from "@/src/components/ui/Btn";
import { withPackage } from "@/src/lib/routes";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { resendCodeAction, verifyCodeAction } from "../../actions";

const RESEND_COOLDOWN_S = 60;

export function VerifyForm({
  email,
  slug,
  fromSignIn,
}: {
  email: string;
  slug: string | null;
  fromSignIn: boolean;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [verifying, startVerify] = useTransition();
  const [resending, startResend] = useTransition();
  const [cooldown, restartCooldown] = useCooldown(RESEND_COOLDOWN_S);

  function verify(value: string) {
    if (value.length !== CODE_LENGTH || verifying) return;
    setError(null);
    startVerify(async () => {
      // Redirects on success; only returns on failure.
      const res = await verifyCodeAction(email, value, slug);
      setError(res.error);
      setCode("");
    });
  }

  function resend() {
    setError(null);
    setNotice(null);
    startResend(async () => {
      const res = await resendCodeAction(email);
      if (res.ok) {
        setNotice("New code sent.");
        restartCooldown();
      } else {
        setError(res.error ?? "Couldn't resend the code.");
      }
    });
  }

  const cta = slug
    ? "Verify and continue to payment"
    : "Verify and create account";

  return (
    <div className="max-w-[430px]">
      <div className="bg-orange/15 text-orange mb-[22px] flex size-[46px] items-center justify-center rounded-xl">
        <MailIcon size={21} />
      </div>
      <Hed
        sub={
          <>
            {fromSignIn ? "Your email isn't verified yet. " : ""}We sent a
            6-digit code to{" "}
            <span className="font-semibold text-white">{email}</span>. It
            expires in 10 minutes.
          </>
        }>
        Check your email.
      </Hed>
      <form
        className="flex flex-col gap-[18px]"
        onSubmit={(e) => {
          e.preventDefault();
          verify(code);
        }}>
        <CodeInput
          value={code}
          onChange={(v) => {
            setCode(v);
            if (error) setError(null);
          }}
          onComplete={verify}
          disabled={verifying}
          invalid={!!error}
        />
        {error && <FormError>{error}</FormError>}
        {notice && !error && (
          <div role="status" className="text-success text-[13px]">
            {notice}
          </div>
        )}
        <Btn
          type="submit"
          variant="primary"
          size="lg"
          full
          loading={verifying}
          disabled={code.length !== CODE_LENGTH}>
          {cta}
        </Btn>
        <ResendRow
          cooldown={cooldown}
          resending={resending}
          onResend={resend}
          backHref={withPackage(fromSignIn ? "/signin" : "/signup", slug)}
          backLabel={fromSignIn ? "Back to sign in" : "Change email"}
        />
      </form>
    </div>
  );
}

/** Seconds-remaining countdown. Starts running immediately — a code was just
 * sent (by signup, or by the sign-in action). */
function useCooldown(seconds: number): [number, () => void] {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  return [left, () => setLeft(seconds)];
}

function ResendRow({
  cooldown,
  resending,
  onResend,
  backHref,
  backLabel,
}: {
  cooldown: number;
  resending: boolean;
  onResend: () => void;
  backHref: string;
  backLabel: string;
}) {
  return (
    <div className="flex flex-wrap justify-between gap-3 text-[13px]">
      <span className="text-white/60">
        No code?{" "}
        {cooldown > 0 ? (
          <span className="text-white/40">Resend in {cooldown}s</span>
        ) : (
          <button
            type="button"
            onClick={onResend}
            disabled={resending}
            className="text-orange font-bold">
            Resend
          </button>
        )}
        <span className="text-white/40"> · check spam</span>
      </span>
      <Link href={backHref} className="text-white/60 underline">
        {backLabel}
      </Link>
    </div>
  );
}
