import { NextRequest, NextResponse } from "next/server";
import { isValidSessionToken } from "@/lib/admin-session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/api/admin")) return NextResponse.next();
  if (pathname === "/api/admin/login") return NextResponse.next();

  const token = request.cookies.get("ct_admin")?.value;
  if (await isValidSessionToken(token)) return NextResponse.next();

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export const config = {
  matcher: ["/api/admin/:path*"],
};
