import { NextResponse } from "next/server";
import { normalizeMediaObjectPath } from "@/lib/cms";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";

const MEDIA_BUCKET = "media";

function contentTypeFor(path: string, blobType?: string) {
  if (blobType && blobType !== "application/octet-stream") return blobType;
  const ext = path.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  return "application/octet-stream";
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  if (!supabaseConfigured()) {
    return NextResponse.json({ error: "Media storage is not connected." }, { status: 503 });
  }

  const { path: parts } = await context.params;
  const rawPath = parts
    .map((part) => decodeURIComponent(part))
    .join("/")
    .replace(/^\/+/, "");

  if (!rawPath || rawPath.includes("..") || rawPath.includes("\\")) {
    return NextResponse.json({ error: "Invalid media path." }, { status: 400 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Media storage is not connected." }, { status: 503 });
  }

  const normalizedPath = normalizeMediaObjectPath(rawPath);
  let downloaded = await supabase.storage.from(MEDIA_BUCKET).download(normalizedPath);
  if ((downloaded.error || !downloaded.data) && normalizedPath !== rawPath) {
    downloaded = await supabase.storage.from(MEDIA_BUCKET).download(rawPath);
  }
  if (downloaded.error || !downloaded.data) {
    return NextResponse.json(
      { error: downloaded.error?.message || "Media not found." },
      { status: 404 },
    );
  }

  const bytes = Buffer.from(await downloaded.data.arrayBuffer());
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": contentTypeFor(normalizedPath, downloaded.data.type),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
