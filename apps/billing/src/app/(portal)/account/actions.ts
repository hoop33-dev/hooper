"use server";

import {
  createSetupIntent,
  setDefaultPaymentMethod,
} from "@/src/services/billing.service";
import { updateMyName } from "@/src/services/profile.service";
import { revalidatePath } from "next/cache";

export type DetailsState = {
  status: "idle" | "saved" | "error";
  errors?: { firstName?: string; lastName?: string };
  message?: string;
};

export async function updateDetailsAction(
  _prev: DetailsState,
  formData: FormData,
): Promise<DetailsState> {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const errors: DetailsState["errors"] = {};
  if (!firstName) errors.firstName = "Required";
  if (!lastName) errors.lastName = "Required";
  if (errors.firstName || errors.lastName) return { status: "error", errors };

  const res = await updateMyName(firstName, lastName);
  if (!res.ok) return { status: "error", message: res.error };
  revalidatePath("/", "layout");
  return { status: "saved" };
}

export async function createSetupIntentAction() {
  return createSetupIntent();
}

export async function setDefaultCardAction(paymentMethodId: string) {
  const res = await setDefaultPaymentMethod(paymentMethodId);
  if (res.ok) revalidatePath("/account");
  return res;
}
