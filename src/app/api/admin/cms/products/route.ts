import { NextResponse } from "next/server";
import { unauthorizedUnlessAdmin } from "@/lib/admin-auth";
import { getCatalog, saveProduct } from "@/lib/cms";

export const runtime = "nodejs";

export async function GET() {
  const denied = await unauthorizedUnlessAdmin("cms");
  if (denied) return denied;
  return NextResponse.json({ products: await getCatalog() });
}

export async function POST(request: Request) {
  const denied = await unauthorizedUnlessAdmin("cms");
  if (denied) return denied;
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
