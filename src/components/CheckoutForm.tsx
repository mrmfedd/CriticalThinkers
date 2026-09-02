"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/products";
import { site } from "@/lib/site";

export function CheckoutForm() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const [error, setError] = useState("");

  if (items.length === 0) {
    return (
      <p className="text-steel">
        Your cart is empty.{" "}
        <a href="/shop" className="text-white underline">
          Return to the shop
        </a>
        .
      </p>
    );
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const required = ["name", "email", "phone", "address", "city", "state", "zip"];
    const missing = required.some((field) => !String(form.get(field) || "").trim());
    if (missing) {
      setError("Please complete every field so we can place the sample order.");
      return;
    }

    const order = {
      customer: Object.fromEntries(form.entries()),
      items,
      subtotal,
      placedAt: new Date().toISOString(),
    };
    window.sessionStorage.setItem("ct-last-order", JSON.stringify(order));
    clearCart();
    router.push("/thank-you");
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="grid gap-4 rounded-md border border-white/10 bg-black/30 p-6">
        <h1 className="font-display text-4xl text-white">Checkout</h1>
        <p className="text-sm text-steel">
          Sample checkout for {site.name}. Orders are stored locally and routed
          to {site.owner}.
        </p>
        <label className="grid gap-1 text-sm">
          Full name
          <input
            name="name"
            required
            className="rounded border border-white/20 bg-black px-3 py-2 text-white"
          />
        </label>
        <label className="grid gap-1 text-sm">
          Email
          <input
            name="email"
            type="email"
            required
            className="rounded border border-white/20 bg-black px-3 py-2 text-white"
          />
        </label>
        <label className="grid gap-1 text-sm">
          Phone
          <input
            name="phone"
            required
            className="rounded border border-white/20 bg-black px-3 py-2 text-white"
          />
        </label>
        <label className="grid gap-1 text-sm">
          Street address
          <input
            name="address"
            required
            className="rounded border border-white/20 bg-black px-3 py-2 text-white"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="grid gap-1 text-sm">
            City
            <input
              name="city"
              required
              className="rounded border border-white/20 bg-black px-3 py-2 text-white"
            />
          </label>
          <label className="grid gap-1 text-sm">
            State
            <input
              name="state"
              required
              className="rounded border border-white/20 bg-black px-3 py-2 text-white"
            />
          </label>
          <label className="grid gap-1 text-sm">
            ZIP
            <input
              name="zip"
              required
              className="rounded border border-white/20 bg-black px-3 py-2 text-white"
            />
          </label>
        </div>
        {error ? <p className="text-sm text-flagRed">{error}</p> : null}
        <button
          type="submit"
          className="rounded bg-flagRed px-6 py-3 font-display tracking-[0.16em] text-white uppercase"
        >
          Place sample order
        </button>
      </div>
      <aside className="h-fit rounded-md border border-white/10 bg-black/40 p-6">
        <h2 className="font-display text-2xl text-white">Your gear</h2>
        <ul className="mt-4 grid gap-3">
          {items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3 text-sm text-steel">
              <span>
                {item.quantity} × {item.name} ({item.color.name})
              </span>
              <span className="text-white">
                {formatPrice(item.price * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex justify-between font-display text-xl text-white">
          <span>Total</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
      </aside>
    </form>
  );
}
