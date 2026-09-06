import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  adminCookieName,
  isValidSessionToken,
} from "@/lib/admin-session";

export async function isAdmin() {
  const jar = await cookies();
  return isValidSessionToken(jar.get(adminCookieName())?.value);
}

export async function unauthorizedUnlessAdmin() {
  if (await isAdmin()) return null;
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
