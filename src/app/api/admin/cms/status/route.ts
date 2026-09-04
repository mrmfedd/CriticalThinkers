import { NextResponse } from "next/server";
import { probeCms } from "@/lib/cms";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ status: await probeCms() });
}
