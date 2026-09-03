import { NextResponse } from "next/server";
import { getCartSessionId, setCartSessionCookie } from "@/lib/cart-session";
import { StoreSetupError, readCart, writeCart } from "@/lib/cart-store";
import { supabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";

function fail(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  const status = error instanceof StoreSetupError ? 503 : 400;
  return NextResponse.json({ error: message, connected: false }, { status });
}

export async function GET() {
  const sessionId = await getCartSessionId();
  if (!supabaseConfigured()) {
    const response = NextResponse.json({ items: [], connected: false });
    setCartSessionCookie(response, sessionId);
    return response;
  }

  try {
    const items = await readCart(sessionId);
    const response = NextResponse.json({ items, connected: true });
    setCartSessionCookie(response, sessionId);
    return response;
  } catch (error) {
    return fail(error, "Could not load the cart.");
  }
}

export async function PUT(request: Request) {
  const sessionId = await getCartSessionId();
  if (!supabaseConfigured()) {
    const response = NextResponse.json({ items: [], connected: false });
    setCartSessionCookie(response, sessionId);
    return response;
  }

  const body = (await request.json().catch(() => null)) as
    | { items?: unknown }
    | null;
  if (!Array.isArray(body?.items)) {
    return NextResponse.json({ error: "Cart items are required." }, { status: 400 });
  }

  try {
    const items = await writeCart(sessionId, body.items);
    const response = NextResponse.json({ items, connected: true });
    setCartSessionCookie(response, sessionId);
    return response;
  } catch (error) {
    return fail(error, "Could not save the cart.");
  }
}
