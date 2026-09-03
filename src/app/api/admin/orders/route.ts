import { NextResponse } from "next/server";
import { listOrders } from "@/lib/cart-store";
import { supabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET() {
  if (!supabaseConfigured()) {
    return NextResponse.json({ orders: [], connected: false });
  }
  try {
    const orders = await listOrders();
    return NextResponse.json({ orders, connected: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not load orders.";
    return NextResponse.json({ error: message, orders: [] }, { status: 400 });
  }
}
