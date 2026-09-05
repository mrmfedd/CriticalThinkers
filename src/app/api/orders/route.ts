import { NextResponse } from "next/server";
import { getCartSessionId, setCartSessionCookie } from "@/lib/cart-session";
import { StoreSetupError, createOrder } from "@/lib/cart-store";
import { supabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const sessionId = await getCartSessionId();
  if (!supabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not connected yet." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    customer?: Record<string, string>;
    items?: unknown;
    paidWith?: string;
    paypalCaptureId?: string;
    paypalOrderId?: string;
  } | null;

  const paidWith = body?.paidWith === "paypal" ? "paypal" : "sample";

  try {
    const order = await createOrder({
      sessionId,
      customer: body?.customer ?? {},
      items: body?.items,
      paidWith,
      paypalCaptureId: body?.paypalCaptureId,
      paypalOrderId: body?.paypalOrderId,
    });
    const response = NextResponse.json({
      id: order.id,
      subtotal: order.subtotal,
      shipping: order.shipping,
    });
    setCartSessionCookie(response, sessionId);
    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not save the order.";
    return NextResponse.json(
      { error: message },
      { status: error instanceof StoreSetupError ? 503 : 400 },
    );
  }
}
