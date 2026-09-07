import { NextResponse } from "next/server";
import { unauthorizedUnlessAdmin } from "@/lib/admin-auth";
import { saveProductView, saveSiteSettings, uploadCmsImage } from "@/lib/cms";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const denied = await unauthorizedUnlessAdmin();
  if (denied) return denied;

  const form = await request.formData();
  const file = form.get("file");
  const folder = String(form.get("folder") || "uploads");
  const name = String(form.get("name") || "image");
  const apply = String(form.get("apply") || "");
  const slug = String(form.get("slug") || "");
  const color = String(form.get("color") || "");
  const view = String(form.get("view") || "front") === "back" ? "back" : "front";

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      {
        error:
          "The image did not arrive. Use a JPEG, PNG, or WebP under 8MB.",
      },
      { status: 400 },
    );
  }

  try {
    const url = await uploadCmsImage({ file, folder, name });

    if (apply === "logo" || apply === "hero") {
      const settings = await saveSiteSettings(
        apply === "logo" ? { logoUrl: url } : { heroUrl: url },
      );
      return NextResponse.json({ url, settings });
    }

    if (apply === "product" && slug) {
      try {
        const product = await saveProductView(slug, color, view, url);
        return NextResponse.json({ url, product });
      } catch (applyError) {
        const message =
          applyError instanceof Error
            ? applyError.message
            : "Could not save that photo to the product.";
        return NextResponse.json({ url, error: message }, { status: 200 });
      }
    }

    return NextResponse.json({ url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not upload that image.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
