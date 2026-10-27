"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  adminCookieName,
  createLegacySessionToken,
  createUserSessionToken,
  passwordsMatch,
  sessionCookieOptions,
} from "@/lib/admin-session";
import { verifyAdminUserLogin } from "@/lib/admin-users";

export async function loginAdmin(
  _prev: { error: string } | null,
  formData: FormData,
) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  const jar = await cookies();

  if (email) {
    const user = await verifyAdminUserLogin(email, password);
    if (!user) {
      return { error: "That email and password did not match an active account." };
    }
    jar.set(
      adminCookieName(),
      await createUserSessionToken(user.id),
      sessionCookieOptions(),
    );
    redirect("/admin");
  }

  const normalized = password.replace(/\s/g, "");
  if (!(await passwordsMatch(normalized))) {
    return { error: "That password did not match." };
  }

  jar.set(
    adminCookieName(),
    await createLegacySessionToken(),
    sessionCookieOptions(),
  );
  redirect("/admin");
}
