import { revalidatePath } from "next/cache";

export function revalidateProfilePages(dashboardPath: string, username: string) {
  revalidatePath(dashboardPath);
  revalidatePath("/" + username);
}
