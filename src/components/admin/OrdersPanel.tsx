"use client";

import { useEffect, useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { formatPrice } from "@/lib/products";
import type { StoredOrder } from "@/lib/cart-types";

export function OrdersPanel() {
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const response = await fetch("/api/admin/orders");
      const payload = (await response.json()) as {
        orders?: StoredOrder[];
        connected?: boolean;
        error?: string;
      };
      if (cancelled) return;
      setConnected(payload.connected !== false);
      setOrders(payload.orders ?? []);
      if (!response.ok) setError(payload.error || "Could not load orders.");
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <AdminHeader
        title="Orders"
        description="Orders saved from checkout into the Supabase cart database."
      />
      {!connected ? (
        <p className="rounded-md border border-white/10 bg-black/30 p-6 text-steel">
          Connect the database first. Open Admin → Database and paste the
          Supabase service role key, then run the cart SQL once.
        </p>
      ) : null}
      {error ? <p className="text-sm text-flagRed">{error}</p> : null}
      {connected && !error && orders.length === 0 ? (
        <p className="rounded-md border border-white/10 bg-black/30 p-6 text-steel">
          No orders yet. Add something to the cart and check out to write the
          first row.
        </p>
      ) : null}
      <div className="grid gap-4">
        {orders.map((order) => (
          <article
            key={order.id}
            className="rounded-md border border-white/10 bg-black/30 p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl text-white">
                  {order.customer_name}
                </h2>
                <p className="mt-1 text-sm text-steel">
                  {order.email}
                  {order.phone ? ` · ${order.phone}` : ""}
                </p>
                <p className="mt-1 text-sm text-steel">
                  {[order.address, order.city, order.state, order.zip]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display text-2xl text-chrome">
                  {formatPrice(order.subtotal)}
                </p>
                <p className="mt-1 text-xs tracking-[0.14em] text-steel uppercase">
                  {order.paid_with} · {order.status}
                </p>
                <p className="mt-1 text-xs text-steel">
                  {new Date(order.created_at).toLocaleString()}
                </p>
              </div>
            </div>
            <ul className="mt-4 grid gap-1 text-sm text-steel">
              {order.items.map((item, index) => (
                <li key={`${order.id}-${index}`}>
                  {item.quantity} × {item.name} ({item.color_name}, {item.size})
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
