/** Date-of-birth entry in NZ order (DD / MM / YYYY), independent of the
 * browser's locale — a native <input type="date"> follows the OS/browser
 * locale and shows MM/DD/YYYY on US-configured machines. */

/** Digits typed so far → "DD / MM / YYYY" with separators inserted as you go. */
export function maskDob(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  const parts = [
    digits.slice(0, 2),
    digits.slice(2, 4),
    digits.slice(4),
  ].filter((p) => p.length > 0);
  return parts.join(" / ");
}

/** Masked text → "YYYY-MM-DD" for validation and storage. Incomplete input
 * yields a malformed string (so validation reports "Enter a valid date");
 * empty input yields "". */
export function dobToIso(masked: string): string {
  const digits = masked.replace(/\D/g, "");
  if (!digits) return "";
  const dd = digits.slice(0, 2);
  const mm = digits.slice(2, 4);
  const yyyy = digits.slice(4, 8);
  return `${yyyy}-${mm}-${dd}`;
}

/** "YYYY-MM-DD" → "DD / MM / YYYY" for prefilling a saved date. */
export function isoToDob(iso: string | null | undefined): string {
  const m = iso?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]} / ${m[2]} / ${m[1]}` : "";
}
