import { NextResponse } from "next/server";
import { unauthorizedUnlessAdmin } from "@/lib/admin-auth";
import { probeCms } from "@/lib/cms";

export const runtime = "nodejs";

export async function GET() {
  const denied = await unauthorizedUnlessAdmin("cms");
  if (denied) return denied;
  return NextResponse.json({ status: await probeCms() });
}
