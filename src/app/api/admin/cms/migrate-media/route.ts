import { NextResponse } from "next/server";
import { unauthorizedUnlessAdmin } from "@/lib/admin-auth";
import { migrateMangledProductMedia } from "@/lib/cms";

export const runtime = "nodejs";

export async function POST() {
  const denied = await unauthorizedUnlessAdmin();
  if (denied) return denied;

  try {
    const result = await migrateMangledProductMedia();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not merge media folders.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
