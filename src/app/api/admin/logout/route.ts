import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminCookieName } from "@/lib/admin-session";

export async function POST() {
  const jar = await cookies();
  jar.delete(adminCookieName());
  return NextResponse.json({ ok: true });
}
