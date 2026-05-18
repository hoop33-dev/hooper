export const PASSWORD_RULE = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
export const PASSWORD_MESSAGE =
  "Min 8 characters with an uppercase letter, a number, and a special character";

export function validatePassword(p: string): string | null {
  if (!p) return "Required";
  if (!PASSWORD_RULE.test(p)) return PASSWORD_MESSAGE;
  return null;
}
