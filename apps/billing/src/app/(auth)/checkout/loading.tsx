import { AuthWrap } from "@/src/components/auth/AuthWrap";
import { cn } from "@/src/lib/cn";

function DarkPulse({ className }: { className: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-white/[0.06]", className)}
    />
  );
}

/** Mirrors `CheckoutLayout`: form column + sticky package summary. */
export default function CheckoutLoading() {
  return (
    <AuthWrap wide>
      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[minmax(0,1fr)_360px] md:gap-10">
        <div className="flex min-w-0 flex-col gap-4">
          <DarkPulse className="h-10 w-64" />
          <DarkPulse className="h-[62px]" />
          <DarkPulse className="h-[180px]" />
          <DarkPulse className="h-[46px]" />
        </div>
        <DarkPulse className="hidden h-[320px] md:block" />
      </div>
    </AuthWrap>
  );
}
