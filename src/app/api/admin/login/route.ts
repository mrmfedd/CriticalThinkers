import { NextResponse } from "next/server";
import { cookies } from "next/headers";
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

  const jar = await cookies();
  jar.set(adminCookieName(), await createSessionToken(), sessionCookieOptions());
  return NextResponse.json({ ok: true });
}
