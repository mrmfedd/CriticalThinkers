"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/products";

export function CartView() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="rounded-md border border-white/10 bg-black/30 p-10 text-center">
        <h1 className="font-display text-4xl text-white">Your cart is empty</h1>
        <p className="mt-3 text-steel">The argument still needs a uniform.</p>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded bg-flagRed px-6 py-3 font-display tracking-[0.16em] text-white uppercase"
        >
          Shop the collection
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
      <div className="grid gap-4">
        {items.map((item) => (
          <article
            key={item.id}
            className="grid gap-4 rounded-md border border-white/10 bg-black/30 p-4 sm:grid-cols-[120px_1fr_auto]"
          >
            <img
              src={item.image}
              alt={item.name}
              className="h-28 w-full rounded object-cover sm:h-28 sm:w-28"
            />
            <div>
              <h2 className="font-display text-xl text-white">{item.name}</h2>
              <p className="mt-1 text-sm text-steel">
                {item.color.name} · {item.size}
              </p>
              <div className="mt-3 flex items-center gap-3">
                <label className="sr-only" htmlFor={`qty-${item.id}`}>
                  Quantity for {item.name}
                </label>
                <input
                  id={`qty-${item.id}`}
                  type="number"
                  min={1}
                  max={12}
                  value={item.quantity}
                  onChange={(event) =>
                    updateQuantity(item.id, Number(event.target.value) || 1)
                  }
                  className="w-16 rounded border border-white/20 bg-black px-2 py-1 text-white"
                />
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="text-sm text-flagRed hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
            <p className="font-display text-xl text-chrome">
              {formatPrice(item.price * item.quantity)}
            </p>
          </article>
        ))}
      </div>
      <aside className="h-fit rounded-md border border-white/10 bg-black/40 p-6">
        <h2 className="font-display text-2xl text-white">Order summary</h2>
        <div className="mt-4 flex justify-between text-steel">
          <span>Subtotal</span>
          <span className="text-white">{formatPrice(subtotal)}</span>
        </div>
        <p className="mt-2 text-sm text-steel">Shipping calculated at checkout.</p>
        <Link
          href="/checkout"
          prefetch={false}
          className="mt-6 block rounded bg-flagRed px-6 py-3 text-center font-display tracking-[0.16em] text-white uppercase"
        >
          Checkout
        </Link>
      </aside>
    </div>
  );
}
