import { NextResponse } from "next/server";
import {
  createPayPalOrder,
  paypalConfigured,
  type CheckoutLine,
} from "@/lib/paypal";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!paypalConfigured()) {
    return NextResponse.json(
      { error: "PayPal is not connected yet." },
      { status: 400 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { items?: CheckoutLine[] }
    | null;

  try {
    const id = await createPayPalOrder(body?.items ?? []);
    return NextResponse.json({ id });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not start PayPal checkout.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
