import { NextResponse } from "next/server";
import {
  adminCookieName,
  createSessionToken,
  passwordsMatch,
  sessionCookieOptions,
} from "@/lib/admin-session";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { password?: string }
    | null;
  const password = body?.password ?? "";

  if (!(await passwordsMatch(password))) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const token = await createSessionToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminCookieName(), token, sessionCookieOptions());
  return response;
}
