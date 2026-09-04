import { NextResponse } from "next/server";
import { deleteProduct, getProduct, saveProduct } from "@/lib/cms";

export const runtime = "nodejs";

type Context = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: Context) {
  const { slug } = await context.params;
  const product = await getProduct(slug);
  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }
  return NextResponse.json({ product });
}

export async function PUT(request: Request, context: Context) {
  const { slug } = await context.params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Product data is required." }, { status: 400 });
  }
  try {
    const product = await saveProduct({ ...body, slug: String(body.slug || slug) }, slug);
    return NextResponse.json({ product });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not save that product.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: Context) {
  const { slug } = await context.params;
  try {
    await deleteProduct(slug);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not delete that product.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
