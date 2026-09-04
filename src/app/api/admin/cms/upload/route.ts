import { NextResponse } from "next/server";
import { getProduct, saveProduct, saveSiteSettings, uploadCmsImage } from "@/lib/cms";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  const folder = String(form.get("folder") || "uploads");
  const name = String(form.get("name") || "image");
  const apply = String(form.get("apply") || "");
  const slug = String(form.get("slug") || "");
  const color = String(form.get("color") || "");
  const view = String(form.get("view") || "front") === "back" ? "back" : "front";

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
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
      const product = await getProduct(slug);
      if (!product) {
        return NextResponse.json({ url, error: "Product not found for apply." }, { status: 200 });
      }
      const views = { ...(product.views ?? {}) };
      const current = views[color] ?? { front: product.image, back: "" };
      views[color || product.colors[0]?.name || "Default"] = {
        ...current,
        [view]: url,
      };
      const updated = await saveProduct(
        {
          ...product,
          views,
          image:
            (!color || color === product.colors[0]?.name) && view === "front"
              ? url
              : product.image,
        },
        slug,
      );
      return NextResponse.json({ url, product: updated });
    }

    return NextResponse.json({ url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not upload that image.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
