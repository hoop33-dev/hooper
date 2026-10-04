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
