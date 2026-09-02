"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  adminCookieName,
  createSessionToken,
  passwordsMatch,
  sessionCookieOptions,
} from "@/lib/admin-session";

export async function loginAdmin(
  _prev: { error: string } | null,
  formData: FormData,
) {
  const password = String(formData.get("password") || "").replace(/\s/g, "");
  if (!(await passwordsMatch(password))) {
    return { error: "That password did not match. Use ThinkAgain2026" };
  }

  const jar = await cookies();
  jar.set(adminCookieName(), await createSessionToken(), sessionCookieOptions());
  redirect("/admin");
}
