"use server";

import { revalidatePath } from "next/cache";
import { setHidden } from "@/lib/db";
import { isAdmin, signInAdmin, signOutAdmin } from "@/lib/admin";

export type AdminLoginState = { error?: string } | undefined;

export async function loginAction(_prev: AdminLoginState, formData: FormData): Promise<AdminLoginState> {
  const ok = await signInAdmin(String(formData.get("token") ?? ""));
  if (!ok) return { error: "Wrong token." };
  revalidatePath("/admin");
  return undefined;
}

export async function logoutAction() {
  await signOutAdmin();
  revalidatePath("/admin");
}

export async function toggleHiddenAction(formData: FormData) {
  if (!(await isAdmin())) throw new Error("not_authorised");
  const id = String(formData.get("id") ?? "");
  const hidden = String(formData.get("hidden") ?? "") === "true";
  await setHidden(id, hidden);
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/recruiter");
}
