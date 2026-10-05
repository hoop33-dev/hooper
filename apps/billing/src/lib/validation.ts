import { validatePassword } from "@hooper/shared";

export type SignUpFields = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
};

export type FieldErrors<K extends string> = Partial<Record<K, string>>;

// Same bar as the mobile signup (non-empty), plus no spaces — a username is
// typed on a phone keyboard to sign in.
const USERNAME_RULE = /^\S{1,30}$/;
const EMAIL_RULE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateUsername(raw: string): string | null {
  const u = raw.trim().toLowerCase();
  if (!u) return "Required";
  if (!USERNAME_RULE.test(u)) {
    return "No spaces, up to 30 characters";
  }
  return null;
}

export function validateEmail(raw: string): string | null {
  const e = raw.trim();
  if (!e) return "Required";
  if (!EMAIL_RULE.test(e)) return "Enter a valid email address";
  return null;
}

export function validateSignUp(
  f: SignUpFields,
): FieldErrors<keyof SignUpFields> {
  const errors: FieldErrors<keyof SignUpFields> = {};
  if (!f.firstName.trim()) errors.firstName = "Required";
  if (!f.lastName.trim()) errors.lastName = "Required";
  const username = validateUsername(f.username);
  if (username) errors.username = username;
  const email = validateEmail(f.email);
  if (email) errors.email = email;
  const password = validatePassword(f.password);
  if (password) errors.password = password;
  return errors;
}

export type ChildFormFields = {
  firstName: string;
  lastName: string;
  dateOfBirth: string; // YYYY-MM-DD from <input type="date">
  username: string;
  password: string;
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** A date of birth: a real calendar date, in the past, and not absurd. */
export function validateDateOfBirth(
  raw: string,
  today = new Date(),
): string | null {
  if (!raw) return "Required";
  if (!ISO_DATE.test(raw)) return "Enter a valid date";
  const d = new Date(`${raw}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== raw) {
    return "Enter a valid date";
  }
  if (d.getTime() >= today.getTime()) return "Must be in the past";
  if (today.getUTCFullYear() - d.getUTCFullYear() > 100)
    return "Enter a valid date";
  return null;
}

/** Child account fields. `requirePassword` is false when editing a profile
 * (the password is changed separately). */
export function validateChild(
  f: ChildFormFields,
  { requirePassword = true }: { requirePassword?: boolean } = {},
): FieldErrors<keyof ChildFormFields> {
  const errors: FieldErrors<keyof ChildFormFields> = {};
  if (!f.firstName.trim()) errors.firstName = "Required";
  if (!f.lastName.trim()) errors.lastName = "Required";
  const dob = validateDateOfBirth(f.dateOfBirth);
  if (dob) errors.dateOfBirth = dob;
  const username = validateUsername(f.username);
  if (username) errors.username = username;
  if (requirePassword) {
    const password = validatePassword(f.password);
    if (password) errors.password = password;
  }
  return errors;
}
