import { NextResponse } from "next/server";
import { getCatalog, saveProduct } from "@/lib/cms";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ products: await getCatalog() });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Product data is required." }, { status: 400 });
  }
  try {
    const product = await saveProduct(body);
    return NextResponse.json({ product });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not save that product.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
