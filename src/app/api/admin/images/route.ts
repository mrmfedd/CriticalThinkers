import { NextResponse } from "next/server";
import { saveUploadedImage } from "@/lib/image-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  const kind = String(form.get("kind") || "");
  const key = String(form.get("key") || "");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
  }
  if (kind !== "brand" && kind !== "product") {
    return NextResponse.json({ error: "Invalid image target." }, { status: 400 });
  }

  try {
    const url = await saveUploadedImage({ kind, key, file });
    return NextResponse.json({ url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not save that image.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
