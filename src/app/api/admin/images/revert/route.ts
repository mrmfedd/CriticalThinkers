import { NextResponse } from "next/server";
import { revertImage } from "@/lib/image-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { kind?: string; key?: string }
    | null;
  const kind = body?.kind;
  const key = body?.key ?? "";

  if (kind !== "brand" && kind !== "product") {
    return NextResponse.json({ error: "Invalid image target." }, { status: 400 });
  }
  if (!key) {
    return NextResponse.json({ error: "Missing image target." }, { status: 400 });
  }

  const url = revertImage(kind, key);
  return NextResponse.json({ url });
}
