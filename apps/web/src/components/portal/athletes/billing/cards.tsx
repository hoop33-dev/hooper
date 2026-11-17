import type { AthleteCard } from "@/src/services/athleteBilling.service";

/** Brand tile for a saved card — read-only; coaches can't change cards. */
export function CardMark({ brand }: { brand: string }) {
  const label =
    brand === "mastercard" ? "MC" : brand === "amex" ? "AMEX" : brand;
  return (
    <div className="font-title flex h-[30px] w-11 flex-shrink-0 items-center justify-center rounded-[5px] bg-[#1A1718] text-[13px] font-black tracking-wide text-white uppercase italic">
      {label.slice(0, 4)}
    </div>
  );
}

/** "Visa •••• 4242". */
export function cardLabel(card: AthleteCard): string {
  const brand = card.brand.charAt(0).toUpperCase() + card.brand.slice(1);
  return `${brand} •••• ${card.last4}`;
}

/** "08/27". */
export function cardExpiry(card: AthleteCard): string {
  return `${String(card.exp_month).padStart(2, "0")}/${String(card.exp_year).slice(-2)}`;
}
