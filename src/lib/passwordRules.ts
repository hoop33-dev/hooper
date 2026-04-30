export const PASSWORD_RULE = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
export const PASSWORD_MESSAGE =
  "Min 8 characters with an uppercase letter and a number";

export function validatePassword(p: string): string | null {
  if (!p) return "Required";
  if (!PASSWORD_RULE.test(p)) return PASSWORD_MESSAGE;
  return null;
}
