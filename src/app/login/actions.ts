"use server";

import { signIn } from "@/auth";
import { safeRedirectPath } from "@/lib/safe-redirect";

export async function discordSignIn(formData: FormData) {
  // Auth.js already enforces a same-origin redirectTo internally, but
  // validate here too rather than relying solely on that.
  const callbackUrl = safeRedirectPath(formData.get("callbackUrl") as string);
  await signIn("discord", { redirectTo: callbackUrl });
}
