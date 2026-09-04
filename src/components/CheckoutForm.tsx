"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/products";
import { PayPalButtons } from "@/components/PayPalButtons";

const requiredFields = [
  "name",
  "email",
  "phone",
  "address",
  "city",
  "state",
  "zip",
];

type CheckoutFormProps = {
  paypal: {
    connected: boolean;
    clientId: string;
    mode: "sandbox" | "live";
  };
  owner: string;
};

export function CheckoutForm({ paypal: initialPaypal, owner }: CheckoutFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const { items, subtotal, clearCart } = useCart();
  const [paypal, setPaypal] = useState(initialPaypal);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadConfig() {
      try {
        const response = await fetch("/api/paypal/config", { cache: "no-store" });
        const payload = (await response.json()) as CheckoutFormProps["paypal"];
        if (!cancelled && payload && typeof payload.connected === "boolean") {
          setPaypal(payload);
        }
      } catch {
        // Keep the server snapshot if the config endpoint is unreachable.
      }
    }
    void loadConfig();
    return () => {
      cancelled = true;
    };
  }, []);

  const collectCustomer = useCallback(() => {
    const form = formRef.current;
    if (!form) throw new Error("Checkout form is missing.");
    const data = new FormData(form);
    const missing = requiredFields.some(
      (field) => !String(data.get(field) || "").trim(),
    );
    if (missing) {
      throw new Error("Fill in your shipping details before paying with PayPal.");
    }
    return Object.fromEntries(data.entries());
  }, []);

  const persistOrder = useCallback(
    async (paidWith: "paypal" | "sample", captureId?: string) => {
      const customer = collectCustomer();
      window.sessionStorage.setItem(
        "ct-last-order",
        JSON.stringify({
          customer,
          items,
          subtotal,
          captureId,
          paidWith,
          placedAt: new Date().toISOString(),
        }),
      );
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer,
          items,
          paidWith,
          paypalCaptureId: captureId,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!response.ok) {
        if (
          response.status === 503 &&
          /not connected/i.test(payload?.error || "")
        ) {
          return;
        }
        throw new Error(payload?.error || "Could not save this order.");
      }
    },
    [collectCustomer, items, subtotal],
  );

  const onPaid = useCallback(
    async (captureId: string) => {
      try {
        await persistOrder("paypal", captureId);
      } catch {
        // Payment already captured; still complete checkout.
      }
      clearCart();
      router.push(`/thank-you?paid=paypal&id=${encodeURIComponent(captureId)}`);
    },
    [clearCart, persistOrder, router],
  );

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

  async function onSampleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await persistOrder("sample");
      clearCart();
      router.push("/thank-you");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Complete every field.");
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={paypal.connected ? (event) => event.preventDefault() : onSampleSubmit}
      className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]"
    >
      <div className="grid gap-4 rounded-md border border-white/10 bg-black/30 p-6">
        <h1 className="font-display text-4xl text-white">Checkout</h1>
        <p className="text-sm text-steel">
          {paypal.connected
            ? `Pay with PayPal. Funds go to ${owner}. ${
                paypal.mode === "sandbox" ? "Sandbox mode is on." : ""
              }`
            : `PayPal is not connected yet. Connect it in Admin → PayPal, or place a sample order.`}
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
        {paypal.connected ? (
          <PayPalButtons
            clientId={paypal.clientId}
            mode={paypal.mode}
            items={items}
            validate={collectCustomer}
            onPaid={onPaid}
            onError={setError}
          />
        ) : (
          <button
            type="submit"
            className="rounded bg-flagRed px-6 py-3 font-display tracking-[0.16em] text-white uppercase"
          >
            Place sample order
          </button>
        )}
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
