"use server";

import { signIn } from "@/auth";

export async function discordSignIn(formData: FormData) {
  const callbackUrl = (formData.get("callbackUrl") as string) || "/dashboard";
  await signIn("discord", { redirectTo: callbackUrl });
}
