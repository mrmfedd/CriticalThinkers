import { NextResponse } from "next/server";
import { getPayPalPublicConfig } from "@/lib/paypal";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(getPayPalPublicConfig(), {
    headers: { "Cache-Control": "no-store" },
  });
}
