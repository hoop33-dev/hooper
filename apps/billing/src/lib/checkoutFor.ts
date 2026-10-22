import type { MyChild } from "@hooper/db";
import { fullName } from "./format";

/** Who a checkout is for: the signed-in user, an existing child, or a child
 * account that will be created when they press Pay. */
export type ForChoice =
  | { who: "me" }
  | { who: "child"; childId: string }
  | { who: "new_child" };

/** Switching the toggle to "For my child": pick the first existing child, or
 * go straight to the new-child form when there are none. */
export function childChoiceDefault(children: MyChild[]): ForChoice {
  return children[0]
    ? { who: "child", childId: children[0].profile_id }
    : { who: "new_child" };
}

export function isForChild(choice: ForChoice): boolean {
  return choice.who !== "me";
}

/** The PackageCard "For" line. */
export function forWhoLabel(
  choice: ForChoice,
  me: {
    firstName: string | null;
    lastName: string | null;
    username: string | null;
  },
  children: MyChild[],
): string {
  if (choice.who === "me") {
    return fullName(me.firstName, me.lastName) || me.username || "You";
  }
  if (choice.who === "new_child") return "New child account";
  const child = children.find((c) => c.profile_id === choice.childId);
  return child
    ? fullName(child.first_name, child.last_name) || child.username
    : "—";
}

/** First name for messages like "Liam already has this package". */
export function forWhoFirstName(
  choice: ForChoice,
  children: MyChild[],
): string | null {
  if (choice.who !== "child") return null;
  const child = children.find((c) => c.profile_id === choice.childId);
  return child?.first_name || child?.username || null;
}
