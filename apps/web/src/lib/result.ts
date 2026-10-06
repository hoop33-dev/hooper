/**
 * Standard return shape for all service-layer functions.
 *
 * Services never throw — they catch internally and return `{ ok: false }`.
 * Callers narrow on `result.ok` to access `data` or `error`.
 */
export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function err<T = never>(error: string): Result<T> {
  return { ok: false, error };
}

/** Normalises an unknown thrown value into a human-readable message. */
export function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "An unexpected error occurred.";
}
