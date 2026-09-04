import { NextResponse } from "next/server";
import { probeCms, saveSiteSettings } from "@/lib/cms";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ status: await probeCms() });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Site settings are required." }, { status: 400 });
  }
  try {
    const settings = await saveSiteSettings(body);
    return NextResponse.json({ settings });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not save site settings.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
