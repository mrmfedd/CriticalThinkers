import { NextResponse } from "next/server";
import {
  adminCookieName,
  createLegacySessionToken,
  createUserSessionToken,
  passwordsMatch,
  sessionCookieOptions,
} from "@/lib/admin-session";
import { verifyAdminUserLogin } from "@/lib/admin-users";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { email?: string; password?: string }
    | null;
  const email = body?.email?.trim().toLowerCase() ?? "";
  const password = body?.password ?? "";

  let token: string | null = null;

  if (email) {
    const user = await verifyAdminUserLogin(email, password);
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    token = await createUserSessionToken(user.id);
  } else {
    const normalized = password.replace(/\s/g, "");
    if (!(await passwordsMatch(normalized))) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }
    token = await createLegacySessionToken();
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminCookieName(), token, sessionCookieOptions());
  return response;
}
