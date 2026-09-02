import { NextResponse } from "next/server";
import { capturePayPalOrder, paypalConfigured } from "@/lib/paypal";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!paypalConfigured()) {
    return NextResponse.json(
      { error: "PayPal is not connected yet." },
      { status: 400 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { orderID?: string }
    | null;
  const orderID = body?.orderID?.trim() || "";
  if (!orderID) {
    return NextResponse.json({ error: "Missing PayPal order." }, { status: 400 });
  }

  try {
    const capture = await capturePayPalOrder(orderID);
    return NextResponse.json(capture);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not finish the PayPal payment.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
